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

import Project from '../../models/projects';

const CREATE_PROJECT_PROPS = [
  'name',
];

const UPDATE_PROJECT_PROPS = [
  'name',
];

const api = Router();
export default api;

api.get( '/', ( req, res ) => {
  // TODO: add archive filter
  query([
    'MATCH (project:Project)-[:CREATED_BY]->(user:User {id:{userId}})',
    'RETURN project',
    'ORDER BY project.created_at',
  ], { userId: req.user.id, } )
    ::map( record => Project( record.get( 'project' ) ) )
    ::toArray()
    ::send( res, 'projects' )
    ;
});

api.post( '/', ( req, res ) => {
  const project = {
    ...filterProps( req.body, CREATE_PROJECT_PROPS ),
    id: id(),
  };

  // TODO: add validations

  query([
    'MATCH (user:User {id:{userId}})',
    'CREATE (project:Project {project})-[:CREATED_BY]->(user)',
    'SET project.created_at = timestamp()',
    'SET project.updated_at = timestamp()',
    'RETURN project',
  ], {
    userId: req.user.id,
    project,
  })
  ::map( record => Project( record.get( 'project' ) ) )
  ::send( res, 'project' )
  ;
});

api.get( '/:id', ( req, res ) => {
  const { id } = req.params;
  const userId = req.user.id;

  query([
    'MATCH (project:Project {id:{id}})-[:CREATED_BY]->(user:User {id:{userId}})',
    'RETURN project',
  ], { id, userId })
  ::map( record => Project( record.get( 'project' ) ) )
  ::send( res, 'project' )
  ;
});

api.patch( '/:id', ( req, res ) => {
  const { id } = req.params;
  const userId = req.user.id;

  const props = filterProps( req.body, UPDATE_PROJECT_PROPS );

  // TODO: add validations
  // TODO: allow changing entity types?

  query([
    'MATCH (project:Project {id:{id}})-[:CREATED_BY]->(user:User {id:{userId}})',
    'SET project += {props}',
    'SET project.updated_at = timestamp()',
    'RETURN project',
  ], { id, userId, props })
  ::map( record => Project( record.get( 'project' ) ) )
  ::send( res, 'project' )
  ;
});

api.delete( '/:id', ( req, res ) => {
  const { id } = req.params;
  const userId = req.user.id;

  query([
    'MATCH (project:Project {id:{id}})-[:CREATED_BY]->(user:User {id:{userId}})',
    'DETACH DELETE project',
  ], { id, userId })
  ::defaultIfEmpty( SUCCESSFULLY_DELETED )
  ::send( res )
  ;
});

