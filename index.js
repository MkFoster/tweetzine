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
        let topic = 'gardening';
        if (req.query.topic) { 
            topic = req.query.topic;
        }

        let maxDate = new Date();
        maxDate.setDate(maxDate.getDate()-3);
        const maxDateISOStr = maxDate.toISOString();

        const twitterClient = new TwitterApi(process.env.TWITTER_API_BEARER_TOKEN);
        const searchResponse = await twitterClient.v2.search(`#${topic} has:media has:images lang:en -is:retweet -is:reply`, {
            'max_results': 100,
            'expansions': 'attachments.media_keys,author_id',
            'media.fields': 'media_key,type,url',
            'sort_order': 'relevancy',
            'tweet.fields': 'public_metrics,created_at',
            'user.fields': 'entities'
            //'end_time': maxDateISOStr
        });

        const tweets = [];
        
        //console.log(JSON.stringify(searchResponse,null,4));

        const hashTally = {};

        for (const tweet of searchResponse) {
            tweet.image = searchResponse.includes.medias(tweet)[0];
            const authorUser = searchResponse.includes.author(tweet);
            const hashtagsObjs = authorUser.entities?.description?.hashtags;
            if (typeof hashtagsObjs != 'undefined') {
                for (const hashtagsObj of hashtagsObjs) {
                    if (typeof hashTally[hashtagsObj.tag.toLowerCase()] === 'undefined') {
                        hashTally[hashtagsObj.tag.toLowerCase()] = 1;
                    } else {
                        hashTally[hashtagsObj.tag.toLowerCase()]++;
                    }
                }
            }
            //console.log(tweet);
            tweets.push(tweet);
        }

        let hashTallyArr = [];
        for (const tag in hashTally) {
            hashTallyArr.push([tag, hashTally[tag]]);
        }

        hashTallyArr.sort(function(a, b) {
            return b[1] - a[1];
        });

        res.render('pages/index', {tweets: tweets, hashTallyArr: hashTallyArr});
    } catch(err) {
        console.error('failed', err);
    }
});

app.listen(port, () => {
    console.log(`TweetZine start on port ${port}`);
});