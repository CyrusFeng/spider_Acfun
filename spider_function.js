const axios = require('axios');
const cheerio = require('cheerio');
const RedisService = require('./redis_service')
const moment = require('moment')
// const jieba = require('nodejieba')

const MongoClient = require('mongodb').MongoClient;
let db;

class Tag {
  constructor(name, value, score) {
    this.name = name;
    this.value = value;
    this.score = score;
  }
}

// (async () => {
//   db = await MongoClient.connect('mongodb://localhost:27017/acfun');
// })()


// MongoClient.connect('mongodb://localhost:27017', function(err, client) {
//   assert.equal(null, err);
//   console.log("Connected successfully to server");

//   const db = client.db('acfun');

//   client.close();
// });
async function spideringArticle(count) {
  const ids = await RedisService.getRandomAcfunIds(count);
  console.log('ids', ids)
  let succeedCount = 0;
  let errCount = 0;
  for (const id of ids) {
    await getSingleActical(id).then(r => {
        succeedCount++;
      })
      .catch(e => {
        errCount++;
        if (e.errCode !== 4040000) {
          throw e;
        }
      })
    await new Promise((resolve, reject) => {
      setTimeout(resolve, 1000);
    })
  }
  return {
    succeedCount,
    errCount
  }
}


async function getSingleActical(id) {
  // console.log(typeof db)
  if (typeof db == 'undefined') {
    let client = await MongoClient.connect('mongodb://localhost:27017')
    db = client.db('acfun')
    // console.log(typeof db)
  }

  const res = await axios.get(`http://www.acfun.cn/a/ac${id}`)
    .catch(e => {
      console.log(e.response.status);
      if (e.response.status == 404) {
        const err = new Error('NOT Found');
        err.errCode = 4040000;
        throw err;
      } else {
        throw e;
      }
    });

  const html = res.data;

  const $ = cheerio.load(html);

  const $articalContent = $('.article-content');

  const title = $('.art-title').children('.art-title-head').children('.caption').text();

  const originCreateAt = moment($('.up-time').text(), 'YYYY年MM月DD日 hh:mm:ss');

  const tags = [];

  const articleTagName = $('.art-channel').text();

  tags.push(new Tag('ARTICLE_TAG_NAME', articleTagName, 1));

  const articleCategory = $('.sort-channel').eq(0).text()

  tags.push(new Tag('ARTICLE_CATEGORY', articleCategory, 1));

  const tagSys = $('.sort-channel').eq(1).text()

  tags.push(new Tag('ARTICLE_TAG_SYS', tagSys, 1));

  // const bdTag = $('#bd_tag > a').text()

  // tags.push(new Tag('ARTICLE_BD_TAG',bdTag,1));

  const tagHttpRes = await axios.get(`http://www.acfun.cn/member/collect_up_exist.aspx?contentId=${id}`)

  const tagList = tagHttpRes.data.data.tagList;

  for (const tag of tagList) {
    tags.push(new Tag('ARTICLE_TAG_USER', tag.tagName, 1));
  }

  if ($articalContent.length == 0) {
    console.log('!$articalContent')
    return;
  } else {
    RedisService.markActicleIdSucceed(id);
    console.log('has $articalContent')
  }

  const content = getImgAndText($articalContent, []);
  // doms.map((i, d) => {
  //   const text = $(d).text();
  //   if (text) {
  //     content.push(text);
  //   } else if (d.name === 'img') {
  //     const src = $(d).attr('src')
  //     content.push(src);
  //   }
  // })
  // console.log('content', content);

  function getImgAndText(dom, arr) {
    const $dom = $(dom);
    const children = $dom.children();
    const len = children.length;
    if (len === 0) {
      const text = $dom.text();

      if (text.length !== 0) {
        arr.push(text);
      } else if ($dom['0'].name === 'img') {
        const src = $dom.attr('src')
        arr.push(src);
      }
    } else {
      for (let i = 0; i < len; i++) {
        getImgAndText(children[i], arr);
      }

    }
    return arr;
  }

  const article = {
    acfunId: id,
    content: content,
    articleContentHtml: $articalContent.html(),
    createAt: Date.now(),
    originCreateAt: originCreateAt,
    title: title,
    tags: tags
  }
  // console.log('article', article)
  // console.log('db.collection',db.collection)
  const result = await db.collection('articles').findOneAndUpdate({
      acfunId: id
    },
    article
    , {
      upsert: true,
      returnNewValue: true
    })
  // console.log(HTMLUnescape($articalContent.html(),'all'))


}




module.exports = {
  spideringArticle,
  getSingleActical
}
// (async () => {

// })().then(() => {

// })