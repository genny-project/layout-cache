/* Create a new Express HTTP server */
const fs = require( 'fs' );
const express = require( 'express' );
const app = express();
const cors = require( 'cors' );

app.use( cors());

/* Listen on port 2224 */
app.listen( 2224, () => console.log( 'Layout cache public server listening on port 2224!' ));

/* Serve up layouts from the local directory */
app.use(( req, res ) => {
  let basePath = '/tmp/layouts';

  if ( req.query.url ) {
    basePath = `/tmp/${req.query.url.split( '/' )[1].split( '.git' )[0]}/public`;
  }

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
