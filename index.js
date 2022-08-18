const express = require('express');
const { TwitterApi } = require('twitter-api-v2');

require('dotenv').config({path: 'variables.env'});

const app = express();
const port = process.env.PORT || 80;
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('./static'));

app.get('/', async(req, res) => {
    try {
        let topic = 'javascript';
        if (req.query.topic) { 
            topic = req.query.topic;
        }

        let maxDate = new Date();
        maxDate.setDate(maxDate.getDate()-3);
        const maxDateISOStr = maxDate.toISOString();

        const twitterClient = new TwitterApi(process.env.TWITTER_API_BEARER_TOKEN);
        const searchResponse = await twitterClient.v2.search(`#${topic} has:media has:images lang:en -is:retweet -is:reply`, {
            'max_results': 100,
            'expansions': 'attachments.media_keys',
            'media.fields': 'media_key,type,url',
            'sort_order': 'relevancy',
            'tweet.fields': 'public_metrics,created_at'
            //'end_time': maxDateISOStr
        });

        const tweets = [];
        
        for (const tweet of searchResponse) {
            if (true || (tweet.public_metrics.like_count > 150) /*&& (tweet.attachments.media_keys.length === 1)*/) {
                tweet.image = searchResponse.includes.medias(tweet)[0];
                tweets.push(tweet);
            }
        }

        //console.log(searchResponse);
        //const recipes = await Recipe.find();
        res.render('pages/index', {tweets: tweets});
    } catch(err) {
        console.error('failed', err);
    }
});

app.listen(port, () => {
    console.log(`TweetZine start on port ${port}`);
});