/* Include dependencies */
const git = require( 'nodegit' );
const fs = require( 'fs' );
const rimraf = require( 'rimraf' );

let repository = null;
let PROXY_ON = false;

rimraf('./tmp', () => {
  console.log( 'Deleted' );
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
});

function fetch() {
  git.Clone(process.env.LAYOUT_REPO, "./tmp").then(() => {
    console.log( 'Successfully cloned layouts repo' );
  }).catch(function(err) { console.log(err); });
}

function pull() {
  git.Repository.open('./tmp')
  .then(function(repo) {
    repository = repo;
    return repository.fetchAll();
  })
  .then(function() {
    return repository.mergeBranches( 'master', 'origin/master' );
  })
  .done(function() {
    console.log("Pull complete");
  });
}

const express = require('express');
const app = express();

app.use(( req, res, next ) => {
  /* Check whether the path is a folder */
  try {
    const isDir = fs.lstatSync( `./tmp${req.path}` ).isDirectory();
    if ( isDir ) {
      /* Get all of the files in the directory */
      fs.readdir( `./tmp${req.path}`, (err, files) => {
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

app.use(express.static('./tmp'));

app.post( '/switch-to-local', ( req, res ) => {
  PROXY_ON = true;
  res.json({ proxyOn: PROXY_ON });
  return;
});

app.listen(2223, () => console.log('Layout cache listening on port 2223!'));
