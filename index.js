/* Include dependencies */
const simpleGit = require('simple-git/promise')('/tmp');
const fs = require( 'fs' );
const rimraf = require( 'rimraf' );

let repository = null;
const branch_name = process.env.NODE_ENV == 'production' ? 'master' : 'dev';

/* Fetch intially and then every minute */
try {
  fetch();
} catch ( e ) {
  console.error( e );
}

setInterval(() => {
  try {
    pull();
  } catch ( e ) {
    console.error( e );
  }
}, 60000);

function fetch() {
  simpleGit.clone( process.env.LAYOUT_REPO )
  .then(() => {
    console.log( 'Successfully cloned layouts repo' );
    simpleGit.cwd( '/tmp/layouts' ).then(() => {
      simpleGit.addConfig( 'user.name', 'Layouts Cache' ).then(() => {
        simpleGit.addConfig( 'user.email', 'layouts@genny.life' ).then(() => {
          simpleGit.checkout(branch_name).then(() => {
            console.log( 'Pulled branch', branch_name );
          });
        });
      });
    });
  })
  .catch(function(err) { console.log(err); });
}

function pull() {
  simpleGit.cwd( '/tmp/layouts' ).then(() => {
    simpleGit.pull( branch_name ).then(() => {
      console.log( `Updated ${branch_name}` );
    });
  });
}

const express = require('express');
const app = express();

app.use(( req, res, next ) => {
  /* Check whether the path is a folder */
  try {
    const isDir = fs.lstatSync( `/tmp/layouts${req.path}` ).isDirectory();
    if ( isDir ) {
      /* Get all of the files in the directory */
      fs.readdir( `/tmp/layouts${req.path}`, (err, files) => {
        res.json(files.map( f => ({
          name: f,
          download_url: `${req.protocol}://${req.get('host')}${req.originalUrl}/${f}`,
        })));
      });
      return;
    } else {
      next();
    }
  } catch ( e ) {
    res.status( 404 );
    res.json({ error: 'File / folder not found' });
    return;
  }
});

app.use(express.static('/tmp/layouts'));

app.listen(2223, () => console.log('Layout cache listening on port 2223!'));
