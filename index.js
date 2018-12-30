/* Include dependencies */
const simpleGit = require( 'simple-git/promise' )( '/tmp' );
const fs = require( 'fs-extra' );

/* Create an object to store the status of the repos */
const repos = {};

/* Define what branch we are using based on the environment variable */
const branch_name = process.env.NODE_ENV == 'production' ? 'master' : 'dev';

/* Get the URL of the repo */
const GIT_REPO = process.env.LAYOUT_REPO || 'https://github.com/genny-project/layouts.git';

/* Setup the authentication if provided */
if ( process.env.SSH_PRIVATE_KEY ) {
  /* Write the private key to file */
  fs.writeFileSync( '/root/private.key', `-----BEGIN RSA PRIVATE KEY-----\n${process.env.SSH_PRIVATE_KEY.trim()}\n-----END RSA PRIVATE KEY-----` );

  /* Change the file permissions */
  fs.chmodSync( '/root/private.key', '600' );
}

/* Return a setup instance of simpleGit */
function getGit() {
  return simpleGit;
}

/* Returns a unique repo identifier from the name */
function getRepoName( url ) {
  return url.split( '/' )[url.split( '/' ).length - 1].split( '.git' )[0];
}

/* Fetches from a particular repo */
function fetch( url, callback ) {
  console.log( url );
  /* Check whether we are in dev mode. If so do nothing */
  if ( process.env.DEV === 'true' ) {
    callback();
    return;
  }

  if ( !url ) {
    url = GIT_REPO;
  }

  if ( repos[url] ) {
    callback();
    return;
  }

  /* Get a name for the repo */
  const repoName = getRepoName( url );

  /* Clone the repo */
  const git = getGit();
  git.clone( url, `/tmp/${repoName}` ).then(() => {
    /* Pull the branch */
    git.cwd( `/tmp/${repoName}` ).then(() => {
      /* Set a username and email */
      git.addConfig( 'user.name', 'Layout Cache' ).then(() => {
        git.addConfig( 'user.email', 'layouts@genny.life' ).then(() => {
          git.checkout( branch_name ).then(() => {
            console.log( 'Pulled branch', branch_name );
            repos[url] = true;
            if ( url !== GIT_REPO ) {
              fs.copy( '/tmp/layouts/shared', `/tmp/${repoName}/shared`, err => {
                if ( err ) {
                  console.error( err );
                }
              });
            }

            callback();

            /* Pull this repo every minute moving forwards */
            setInterval(() => {
              pull( url );
            }, process.env.SYNC_INTERVAL || 60000 );
          });
        });
      });
    });
  }).catch( function( err ) { console.log( err ); });
}

/* Pulls from a particular repo */
function pull( url ) {
  /* Clone the repo */
  const git = getGit();

  /* Get a name for the repo */
  const repoName = getRepoName( url );

  git.cwd( `/tmp/${repoName}` ).then(() => {
    git.pull( branch_name ).then(() => {
      console.log( `Updated ${branch_name}` );
      if ( url !== GIT_REPO ) {
        fs.copy( '/tmp/layouts/shared', `/tmp/${repoName}/shared`, err => {
          if ( err ) {
            console.error( err );
          }
        });
      }
    });
  });
}

/* Create a new Express HTTP server */
const express = require( 'express' );
const app = express();
const cors = require( 'cors' );

app.use( cors());

/* When the app starts fetch the public repo */

/* Serve up layouts from the local directory */
app.use(( req, res ) => {
  let basePath = '/tmp/layouts';

  if ( req.query.url ) {
    basePath = `/tmp/${req.query.url.split( '/' )[1].split( '.git' )[0]}`;
  }

  /* Fetch the repo if needed */
  fetch( GIT_REPO, () => {
    fetch( req.query.url, () => {

    });
  });

        /* Check whether the path is a folder */
        try {
          const isDir = fs.lstatSync( `${basePath}${req.path.split( '?' )[0]}` ).isDirectory();
          if ( isDir ) {
            /* Get all of the files in the directory */
            fs.readdir( `${basePath}${req.path.split( '?' )[0]}`, ( err, files ) => {
              res.json( files.map( f => ({
                name: f,
                download_url: `${req.protocol}://${req.get( 'host' )}${req.originalUrl.split( '?' )[0]}/${f}`,
                path: `${req.originalUrl.split( '?' )[0]}/${f}`,
                modified_date: fs.statSync( `${basePath}${req.originalUrl.split( '?' )[0]}/${f}` ).mtime
              })));
            });
            return;
          } else {
            /* Read the file */
            fs.readFile( `${basePath}${req.path.split( '?' )[0]}`, ( err, result ) => {
              if ( err || !result ) {
                res.status( 404 );
                res.json({ error: 'File / folder not found' });
                return;
              }
  
              res.send( result );
            });
          }
        } catch ( e ) {
          res.status( 404 );
          res.json({ error: 'File / folder not found' });
          return;
        }
});

/* Listen on port 2223 */
app.listen( 2223, () => console.log( 'Layout cache listening on port 2223!' ));

/* Include the public server */
require( './public.js' );

/* When the app starts fetch the repo */
fetch( GIT_REPO, () => {});