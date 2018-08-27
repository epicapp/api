// @flow
import express from 'express';
import cors from 'cors';

import v1 from './v1';

const app = express();

// eslint-disable-next-line space-in-parens
app.use( cors() );

/**
 * FIXME: placeholder until there is user auth
 */
app.use(( req, res, next ) => {
  req.user = {
    id: '000',
    email: 'josh@joshdmiller.com',
    name: 'Josh David Miller',
  };

  next();
});

app.use(( req, res, next ) => {
  console.log( `${req.method} ${req.path}` );

  next();
});

app.use( '/v1', v1 );

app.listen( 8080, () => console.log( 'Server is listening on port 8080...' ));

