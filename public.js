/* Create a new Express HTTP server */
const fs = require( 'fs' );
const express = require( 'express' );
const app = express();
const cors = require( 'cors' );

app.use( cors());

/* Listen on port 2224 */
app.listen( 2224, () => console.log( 'Layout cache public server listening on port 2224!' ));

/* Create a public endpoint */
app.get( '/public', ( req, res ) => {
  /* Depending whether or not a repo url was provided define the base path */
  let basePath = '/tmp/layouts';

  if ( req.query.url ) {
    basePath = process.env.DEV
      ? `/tmp/layouts/${req.query.url.split( '/' )[1].split( '.git' )[0]}`
      : `/tmp/${req.query.url.split( '/' )[1].split( '.git' )[0]}`;
  }

  /* Attempt to read the public routing file */
  fs.readFile( `${basePath}/routing.public.json`, ( err, data ) => {
    /* If an error occured then return it */
    if ( err ) {
      res.status( 500 );
      res.json({
        error: 'An unexpected error occured loading the public routing configuration for this repository.'
      });
      return;
    }

    let parsed = null;

    try {
      /* Convert the data to a string and JSON parse it */
      parsed = JSON.parse( data.toString());
    } catch ( e ) {
      console.error( e );

      res.status( 500 );
      res.json({
        error: 'An unexpected error occured loading the public routing configuration for this repository.'
      });
      return;
    }

    /* Loop over each file in the parsed file */
    const files = parsed.map( entry => readJSONFile( `${basePath}/${entry.path}` ));

    Promise.all( files ).then( result => {
      res.json( parsed.map(( entry, index ) => {
        entry.data = result[index];
        return entry;
      }));
    });
  });
});

/* Returns a promise that resolves when the file is loaded */
function readJSONFile( path ) {
  return new Promise(( resolve, reject ) => {
    /* Read the file */
    fs.readFile( path, ( err, data ) => {
      if ( err ) {
        return reject( err );
      }

      try {
        const parsed = JSON.parse( data.toString());
        return resolve( parsed );
      } catch ( e ) {
        return reject( e );
      }
    });
  });
}
