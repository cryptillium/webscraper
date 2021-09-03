/*/////////////////////////////////////

To make appliction run global: 

* set package.json as:
name: "<name of application>"
bin : "./index.js"

* run: 
       npm link 
       npm link < application name >
       
* to remove: run npm unlink
* to make npm available: run: npm publish
                          or: npm publish . --access=public
  users can then install the project globally using the command:
     - npm i < application name > -g
  
  the application can then be executed by just typing at the command line :>
  $ < application name >


* to repair npm linking:
  - delete node_modules
  - run: npm unlink --no-save [dependency-module]
  - relink npm (npm link)

/////////////////////////////////////*/


'use strict'



  const fs = require('fs')
  const axios = require('axios');
  var cheerio = require('cheerio');
  const request = require('request')

  const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {  
      request(url)
        .pipe(fs.createWriteStream(path))
        .on('close', callback)
    })
  }


  function downloadWebPage(url){
    var folder = url.replace(/^https?\:\/\//i, '').replace("/","_")

    // create directory if not exist
    if (!fs.existsSync(folder)){
        fs.mkdirSync(folder);
    }


    ////// CORE FUNCTION //////////
    axios.get(url)
    .then(response => {
      // on get request
      // get response data
      var data = response.data;

      
      // load the data into dom object      
      var $ = cheerio.load(data);

      // ExtractTagSource("script", $, folder);
      ExtractTagSource("link", $, folder);

 
      
      fs.writeFile(folder + "/" + 'index.html', $.html(), (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;
    
        // success case, the file was saved
        console.log('webpage saved');

      });


    })
    .catch(error => {
      console.log(error);
    });  
    //////////////////////////////



  }




  function ExtractTagSource(tag, data, wd){       

      var attributes = [];
      let rows = data(tag).each((idx, elem) => {


        var self = data(this);

        attributes[idx] = {
          attrs: elem.attribs,
          html: self.html(),
          text: self.text(),
        };

        var arrAttrkeys = Object.keys(attributes[idx].attrs)
        if(arrAttrkeys.length>0){
          var attr = attributes[idx].attrs;
          var src = getExtraction(attr, tag, wd, data);

          console.log(src)

          if(src){
            
            // check directory exists, if not create it 
            if (!fs.existsSync(wd + "/" + src.path)){
              fs.mkdirSync(wd + "/" + src.path);
            }  

            var filePath = src.directPath + "/" + src.filename;
            fs.access( filePath, fs.F_OK, (err) => {

              // file not exist
              if (err) {
                // console.error(err)
                download(src.uri, filePath, () => {
                  console.log('✅ Done!')
                })

                return
              }

              // file exists
            })             


            // update file reference to local files
            elem.attribs.src = src.relLink + src.filename;

          }
        }


      });
      // end script extraction

  }


  function getExtraction(refAttr, elm, baseDir, _$){
    var file = "";

    if(elm=="script"){
      // check the script source
      var origin = refAttr.src
      // only continue if we have a source
      if(origin){
          // ensure asset URL is correct, fix if incorrect
          var uri = origin.replace(/^h?t?t?p?s?:?\/\//,"http://")
          // extract the file name from the uri
          file = origin.match(/[^\/]+$/)

          return({
            uri: uri,
            path: elm,
            relLink: './' + elm + '/',
            filename: file[0],
            directPath: baseDir + "/" + elm
          })
      }  
    }

    if(elm=="link"){
      //console.log(_$)
      console.log(refAttr)
    }
  }




  downloadWebPage("http://www.ig.com/au")

 