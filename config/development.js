const foodTypes = [
        // Cultures
        'mexican',
        'spanish',
        'italian',
        'thai',
        'chinese',
        'american',
        'korean',
        'indian',
        'japanese',
        'french',
        'greek',
        'vietnamese',
        'mediterranean',
        'hawaiian',

        // Types
        'seafood',
        'vegan',
        'soup',
        'soups',
        'salad',
        'salads',
        'hamburger',
        'hamburgers',
        'healthy',
        'burrito',
        'burritos',
        'taco',
        'tacos',
        'sandwich',
        'sandwiches',
        'fast food',
        'junk food',
        'coffee',
        'sushi'
      ];

module.exports = {
  suggestionPatterns: [
    '^.*?\\bfor lunch\\b.*?$',
    '^.*?\\bsuggestions\\b.*?$',
    '^.*?\\bsuggest\\b.*?$',
    '^.*?\\bideas\\b.*?$'
  ],
  additionPatterns: [
    '^.*?\\badd\\b.*?$',
    '^.*?\\bsave\\b.*?$',
    '^.*?\\bcreate\\b.*?$',
    '^.*?\\bnew\\b.*?$'
  ],
  randomPatterns: [
    // '^.*?\\brandom\\b.*?$',
    // '^.*?\\bsomething new\\b.*?$',
    `^.*?\\bfeel like \\b(${foodTypes.join('|')}).*?$`,
    `^.*?\\bfeeling like \\b(${foodTypes.join('|')}).*?$`,
    `^.*?\\bfeeling \\b(${foodTypes.join('|')}).*?$`
  ],
  // Any Slack user IDs in this array will be ignored by the bot.
  blacklistedUserIds: [
    'U04UT8QHM'
  ]
}