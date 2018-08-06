/* Create a new Express HTTP server */
const express = require( 'express' );
const app = express();
const cors = require( 'cors' );

app.use( cors());

/* Listen on port 2224 */
app.listen( 2224, () => console.log( 'Layout cache public server listening on port 2224!' ));
