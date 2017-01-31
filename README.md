# Lunch Slack Bot
A Slack bot that uses Yelp to suggest and save places to go for lunch.

## Technologies
- Node
- Slack Bots
- Botkit (Slack Bot API)
- Yelp API
- AWS
- MongoDB
- Monk (MongoDB API)

## Prerequisites
- [Node 6.x & NPM 3.x](https://nodejs.org) (or `brew install node` if using macOS)

## Environment Variables
| Name | Purpose | Example | Required |
|------|---------|---------|----------|
| `SLACK_API_TOKEN` | The Slack API auth token. | `Abc123` | Yes
| `MONGODB_URI` | The MongoDB connection string. | `localhost:27017/my_database` | Yes
| `YELP_CONSUMER_KEY` | The Yelp API consumer key | `Abc123` | Yes
| `YELP_CONSUMER_SECRET` | The Yelp API consumer secret | `Abc123` | Yes
| `YELP_TOKEN` | The Yelp API token | `Abc123` | Yes
| `YELP_TOKEN_SECRET` | The Yelp API token secret | `Abc123` | Yes
| `DEFAULT_LOCATION` | The default location that Yelp will use for searches | `'18022 Cowan, Irvine, 92614'` | Yes

## Running Locally
1. [Create a Slack bot](https://api.slack.com/bot-users) (this will yield an API token)
1. [Create a Yelp account](https://www.yelp.com/signup) (or [login](https://www.yelp.com/login) to an existing one)
1. [Obtain a Yelp API key](https://www.yelp.com/developers/manage_api_keys)
1. Duplicate `.env.sample`, rename it to `.env` and provide values for each key (see above)
1. `npm i`
1. Ensure that MongoDB is running and the database has been created at the location specified in the environment variable
1. `npm start` (or `./node_modules/.bin/pm2 start index.js`)
1. Invite your bot to a channel and start chatting!

## To Do
- Tests
- Database seeding (`npm run seed`)
- User voting

## Resources
- [Slack Bots](https://api.slack.com/bot-users)
- [Botkit](https://github.com/howdyai/botkit)
- [Node Yelp](https://github.com/olalonde/node-yelp)
- [Yelp Search API](https://www.yelp.com/developers/documentation/v2/search_api)
- [Yelp Business API](https://www.yelp.com/developers/documentation/v2/business)
- [Yelp API Console](https://www.yelp.com/developers/api_console)
- [Monk](https://github.com/Automattic/monk/)
- [Monk Documentation](https://automattic.github.io/monk/index.html)