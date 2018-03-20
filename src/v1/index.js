// @flow
import { Router } from 'express';

const api = Router();

api.get( '/users/:id', ( req, res ): void => {
  if ( req.params.id === req.user.id ) {
    return res.send( req.user );
  }

  res.status( 404 ).send({ message: 'user not found' });
});

export default api;

