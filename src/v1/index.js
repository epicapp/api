import { Router } from 'express';
import { map } from 'rxjs/operator/map';
import { toArray } from 'rxjs/operator/toArray';
import { query } from './graph';
import bodyParser from 'body-parser';
import send from './responses';

import { Dt } from './models/dates';

import entries from './routes/entries';
import projects from './routes/projects';

const api = Router();

api.use( bodyParser.json() );

api.get( '/users/:id', ( req, res ): void => {
  if ( req.params.id === req.user.id ) {
    return res.send( req.user );
  }

  res.status( 404 ).send({ message: 'user not found' });
});

api.get( '/', ( req, res ) => {
  res.send({ version: '1.0' });
});

api.use( '/entries', entries );
api.use( '/projects', projects );

api.get( '/all', ( req, res ) => {
  query([
    'MATCH (year:Year)<-[:MONTH_OF]-(month:Month)<-[:DAY_OF]-(day:Day)',
    'WHERE year.year = 2019 AND month.month > 4 AND month.month < 7',
    'RETURN year, month, day',
    'ORDER BY year.year, month.month, day.day',
  ])
    ::map( record => Dt( record.get( 'day' ), record.get( 'month' ), record.get( 'year' ) ) )
    ::toArray()
    ::send( res, 'days' )
    ;
});

export default api;

