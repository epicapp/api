import { Router } from 'express';
import { map } from 'rxjs/operator/map';
import { defaultIfEmpty } from 'rxjs/operator/defaultIfEmpty';
import { toArray } from 'rxjs/operator/toArray';
import { generate as id } from 'shortid';
import { query } from '../../graph';
import send, {
  SUCCESSFULLY_DELETED,
} from '../../responses';
import {
  filterProps,
} from '../../utilities';

import Entry from '../../models/entries';

const CREATE_ENTRY_PROPS = [
  'content',
];

const UPDATE_ENTRY_PROPS = [
  'content',
];

const api = Router();
export default api;

api.get( '/', ( req, res ) => {
  const filters = {
    start: 0,
    count: false,
    limit: 10,

    ...req.query,
  };

  const count = ( filters.count !== false ) && [ '0', 'false', 'off' ].every( v => v !== filters.count );

  let res$ = query([
    'MATCH (entry:Entry)-[:CREATED_BY]->(user:User {id:{userId}})',
    count ? 'return count( entry ) as entries' : 'RETURN entry',
    count || 'ORDER BY entry.created_at',
    count || `SKIP ${filters.start} LIMIT ${filters.limit}`,
  ], {
    userId: req.user.id,
    filters,
  });

  if ( ! count ) {
    res$ = res$
      ::map( record => Entry( record.get( 'entry' ) ) )
      ::toArray()
      ;
  } else {
    res$ = res$::map( record => record.get( 'entries' ).toInt() );
  }

  res$::send( res, 'entries' );
});

api.post( '/', ( req, res ) => {
  const entry = {
    ...filterProps( req.body, CREATE_ENTRY_PROPS ),
    id: id(),
  };

  // TODO: add validations

  query([
    'MATCH (user:User {id:{userId}})',
    'CREATE (entry:Entry {entry})-[:CREATED_BY]->(user)',
    'SET entry.created_at = timestamp()',
    'SET entry.updated_at = timestamp()',
    'RETURN entry',
  ], {
    userId: req.user.id,
    entry,
  })
  ::map( record => Entry( record.get( 'entry' ) ) )
  ::send( res, 'entry' )
  ;
});

api.get( '/:id', ( req, res ) => {
  const { id } = req.params;
  const userId = req.user.id;

  query([
    'MATCH (entry:Entry {id:{id}})-[:CREATED_BY]->(user:User {id:{userId}})',
    'RETURN entry',
  ], { id, userId })
  ::map( record => Entry( record.get( 'entry' ) ) )
  ::send( res, 'entry' )
  ;
});

api.patch( '/:id', ( req, res ) => {
  const { id } = req.params;
  const userId = req.user.id;

  const props = filterProps( req.body, UPDATE_ENTRY_PROPS );

  // TODO: add validations

  query([
    'MATCH (entry:Entry {id:{id}})-[:CREATED_BY]->(user:User {id:{userId}})',
    'SET entry += {props}',
    'SET entry.updated_at = timestamp()',
    'RETURN entry',
  ], { id, userId, props })
  ::map( record => Entry( record.get( 'entry' ) ) )
  ::send( res, 'entry' )
  ;
});

api.delete( '/:id', ( req, res ) => {
  const { id } = req.params;
  const userId = req.user.id;

  query([
    'MATCH (entry:Entry {id:{id}})-[:CREATED_BY]->(user:User {id:{userId}})',
    'DETACH DELETE entry',
  ], { id, userId })
  ::defaultIfEmpty( SUCCESSFULLY_DELETED )
  ::send( res )
  ;
});

