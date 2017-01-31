require('dotenv').config();

if (!process.env.SLACK_API_TOKEN) {
  throw new Error('The SLACK_API_TOKEN environment variable must be configured.');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  throw new Error('The MONGODB_URI environment variable must be configured.');
  process.exit(1);
}

if (!process.env.YELP_CONSUMER_KEY) {
  throw new Error('The YELP_CONSUMER_KEY environment variable must be configured.');
  process.exit(1);
}

if (!process.env.YELP_CONSUMER_SECRET) {
  throw new Error('The YELP_CONSUMER_SECRET environment variable must be configured.');
  process.exit(1);
}

if (!process.env.YELP_TOKEN) {
  throw new Error('The YELP_TOKEN environment variable must be configured.');
  process.exit(1);
}

if (!process.env.YELP_TOKEN_SECRET) {
  throw new Error('The YELP_TOKEN_SECRET environment variable must be configured.');
  process.exit(1);
}

if (!process.env.DEFAULT_LOCATION) {
  throw new Error('The DEFAULT_LOCATION environment variable must be configured.');
  process.exit(1);
}

const config = require('./config')[process.env.NODE_ENV || 'development'],
      Yelp = require('yelp'),
      yelp = new Yelp({
        consumer_key: process.env.YELP_CONSUMER_KEY,
        consumer_secret: process.env.YELP_CONSUMER_SECRET,
        token: process.env.YELP_TOKEN,
        token_secret: process.env.YELP_TOKEN_SECRET
      }),
      controller = require('botkit').slackbot({
        // debug: true,
        storage: require('./storage')()
      }),
      bot = controller.spawn({
        token: process.env.SLACK_API_TOKEN
      }).startRTM((err, bot, payload) => {
        if (err) {
          throw new Error('Error connecting to Slack.', err);
          process.exit(1);
        }
      });

/**
 * Checks if a user is blacklisted.
 *
 * @param  {Object} message
 * @return {Boolean}
 */
function userIsBlacklisted (message) {
  return config.blacklistedUserIds.includes(message.user);
}

/**
 * A special listener for a "special" person.
 */
function userIsElias (message) {
  return message.user === 'U04UT8QHM';
};

/**
 * Listener for lunch suggestions.
 */
controller.hears(config.suggestionPatterns, ['direct_mention'], (bot, message) => {
  if (userIsElias(message)) {
    bot.reply(message, {
      text: '',
      icon_emoji: ':chipotle:'
    })
    return;
  }
  if (userIsBlacklisted(message)) return;
  if (message.match.length) {
    controller.storage.teams.get(message.team).then(
      team => {
        if (!team || !team.suggestions || !team.suggestions.length) {
          bot.reply(message, 'Looks like this team hasn\'t saved any favorite lunch places. Try mentioning me and saying something like "save a new place" or "create a suggestion".');
        } else {
          const randomIndex = Math.floor(Math.random() * team.suggestions.length),
                randomSuggestion = team.suggestions[randomIndex],
                /**
                 * If a suggestion already has a Yelp URL, then use that
                 * instead of making an unnecessary call.
                 */
                yelpData = randomSuggestion.yelpUrl
                  ? {businesses: [{url: randomSuggestion.yelpUrl}]} // Simulate a Yelp response
                  : yelp.search({term: randomSuggestion.name, location: process.env.DEFAULT_LOCATION, limit: 1});
          // TODO: Increment count field: {$inc: {count: 1}}
          Promise.all([
            randomSuggestion,
            yelpData
          ])
          .then(
            responses => {
              const randomSuggestion = responses[0],
                    yelpData = responses[1],
                    url = yelpData.businesses[0].url.split('?')[0];  // Get rid of annoying query params that the API appends; TODO: Ensure result exists
              bot.reply(message, `How about ${randomSuggestion.name}? ${url}`);
            },
            error => {
              bot.reply(message, `How about ${randomSuggestion.name}?`);
              console.log('Error searching Yelp:', error);
            }
          );
        }
      },
      error => {
        bot.reply(message, 'Sorry, I\'m having trouble finding your team');
        console.log('Error fetching team:', error);
      }
    );
  }
});

/**
 * Listener for saving a new lunch place.
 */
controller.hears(config.additionPatterns, ['direct_mention'], (bot, message) => {
  if (userIsElias(message)) {
    bot.reply(message, {
      text: '',
      icon_emoji: ':chipotle:'
    })
    return;
  }
  if (userIsBlacklisted(message)) return;
  /**
   * Prompts for the name of a place to find.
   *
   * @param  {Object} response
   * @param  {Objet} conversation
   * @return {undefined}
   */
  function askForName (response, conversation) {
    conversation.ask('What\'s the name of the place?', (response, conversation) => {
      yelp.search({
        term: response.text,
        location: process.env.DEFAULT_LOCATION,
        limit: 1
      })
      .then(
        yelpData => {
          askForYelpConfirmation(response, conversation, yelpData);
          conversation.next();
        },
        error => {
          conversation.say('Sorry, I\'m having trouble searching Yelp');
          console.log('Error searching Yelp:', error);
          conversation.next();
        }
      );
    });
  }

  /**
   * Prompts for confirmation of a place found via Yelp.
   *
   * @param  {Object} response
   * @param  {Object} conversation
   * @param  {Object} yelpData
   * @return {undefined}
   */
  function askForYelpConfirmation (response, conversation, yelpData) {
    const yelpUrl = yelpData.businesses[0].url.split('?')[0]; // Get rid of annoying query params that the API appends
    conversation.ask(`I found ${yelpUrl} ...is that right?`, [
      {
        pattern: bot.utterances.yes,
        callback: (response, conversation) => {
          controller.storage.teams.get(message.team)
            .then(
              team => {
                const existingSuggestion = team.suggestions.find(suggestion => suggestion.yelpUrl === yelpUrl);
                if (existingSuggestion) {
                  conversation.say('Hmm, looks like I already know about that place');
                  conversation.next();
                  return;
                }
                controller.storage.teams.save(message.team, {
                  name: yelpData.businesses[0].name,
                  address: yelpData.businesses[0].location.address[0],
                  city: yelpData.businesses[0].location.city,
                  zip: yelpData.businesses[0].location.postal_code,
                  yelpId: yelpData.businesses[0].id,
                  yelpUrl
                })
                .then(
                  () => {
                    conversation.say('Cool, I saved that for you');
                    conversation.next();
                  },
                  error => {
                    conversation.say('Sorry, something went wrong and I wasn\'t able to save that for you');
                    console.log('Error saving suggestion:', error);
                    conversation.next();
                  }
                );
              },
              error => {
                conversation.say('Sorry, I\'m having trouble finding your team');
                console.log('Error fetching team:', error);
                conversation.next();
              }
            );
        }
      },
      {
        pattern: bot.utterances.no,
        callback: (response, conversation) => {
          askForYelpUrl(response, conversation);
          conversation.next();
        }
      }
    ]);
  }

  /**
   * Prompts for a Yelp URL.
   *
   * @param  {Object} response
   * @param  {Object} conversation
   * @return {undefined}
   */
  function askForYelpUrl (response, conversation) {
    conversation.ask('Ok, what\'s the Yelp link?', (response, conversation) => {
      const yelpUrl = response.text.split('?')[0]; // Get rid of any query params
            yelpBusinessId = yelpUrl.replace(/<|>/g, '').split('/').slice(-1)[0]; // TODO: This is brittle and error-prone
      yelp.business(yelpBusinessId)
        .then(
          yelpData => {
            controller.storage.teams.get(message.team)
              .then(
                team => {
                  const existingSuggestion = team.suggestions.find(suggestion => suggestion.yelpId === yelpBusinessId);
                  if (existingSuggestion) {
                    conversation.say('Hmm, looks like I already know about that place');
                    conversation.next();
                    return;
                  }
                  controller.storage.teams.save(message.team, {
                    name: yelpData.name,
                    address: yelpData.location.address[0],
                    city: yelpData.location.city,
                    zip: yelpData.location.postal_code,
                    yelpId: yelpData.id,
                    yelpUrl: yelpData.url.split('?')[0] // Get rid of annoying query params that the API appends
                  })
                  .then(
                    () => {
                      conversation.say('Cool, I saved that for you');
                      conversation.next();
                    },
                    error => {
                      conversation.say('Sorry, something went wrong and I wasn\'t able to save that for you');
                      console.log('Error saving suggestion:', error);
                      conversation.next();
                    }
                  );
                },
                error => {
                  conversation.say('Sorry, I\'m having trouble finding your team');
                  console.log('Error fetching team:', error);
                  conversation.next();
                }
              );
          },
          error => {
            conversation.say('Sorry, I\'m having trouble understanding that link');
            console.log('Error fetching Yelp business:', error);
            conversation.next();
          }
        );
    });
  }

  bot.startConversation(message, askForName);
});

/**
 * Listener for producing a random lunch location.
 */
controller.hears(config.randomPatterns, ['direct_mention'], (bot, message) => {
  if (userIsElias(message)) {
    bot.reply(message, {
      text: '',
      icon_emoji: ':chipotle:'
    })
    return;
  }
  if (userIsBlacklisted(message)) return;
  if (message.match.length) {
    yelp.search({term: message.match[1], location: process.env.DEFAULT_LOCATION, limit: 20 /* offset: ? */})
      .then(
        yelpData => {
          const randomIndex = Math.floor(Math.random() * yelpData.businesses.length),
                randomSuggestion = yelpData.businesses[randomIndex],
                url = randomSuggestion.url.split('?')[0];  // Get rid of annoying query params that the API appends; TODO: Ensure result exists
          bot.reply(message, `How about ${randomSuggestion.name}? ${url}`);
        },
        error => {
          bot.reply(message, 'Sorry, I\'m having trouble searching Yelp');
          console.log('Error searching Yelp:', error);
        }
      );
  }
});

/**
 * Listener for producing a random lunch location.
 */
controller.hears('help', ['direct_mention'], (bot, message) => {
  if (userIsElias(message)) {
    bot.reply(message, {
      text: '',
      icon_emoji: ':chipotle:'
    })
    return;
  }
  if (userIsBlacklisted(message)) return;
  const reply = `To get a random saved lunch place, say things like:
  > @lunchbot have any *suggestions*?
  > @lunchbot any bright *ideas*?
  > @lunchbot what's *for lunch*?

  To save a new favorite lunch place, say things like:
  > @lunchbot *save* a lunch place
  > @lunchbot can you *add* a lunch place?
  > @lunchbot let's *create* a favorite
  > @lunchbot make a *new* suggestion

  To get a nearby random Yelp result, say things like:
  > @lunchbot i'm *feeling* chinese
  > @lunchbot we *feel like* american

  (Not to brag, but I know over 30 different types of food!)

  To get help, say:
  > @lunchbot help
  `;
  bot.reply(message, reply);
});

/**
 * Listener for user voting.
 */
// controller.hears(config.votePatterns, ['direct_mention'], (bot, message) => {
//   bot.reply(message, 'voting');
// });