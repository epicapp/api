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
  isTruthyParam,
} from '../../utilities';

import Entry from '../../models/entries';

const CREATE_ENTRY_PROPS = [
  'content',
  'time_started_at',
  'time_ended_at',
];

const UPDATE_ENTRY_PROPS = [
  ...CREATE_ENTRY_PROPS,
];

const ENTRY_TYPES = [
  'TimeEntry',
  'Note',
];

const ENTRY_WITH_DATES = [
  'OPTIONAL MATCH (entry)-[:FROM]->(day:Day)-[:DAY_OF]->(month:Month)-[:MONTH_OF]->(year:Year)',
  'WITH entry, project, [ day, month, year ] as day',
  'OPTIONAL MATCH (entry)-[:FROM]->(month:Month)-[:MONTH_OF]->(year:Year)',
  'WITH entry, project, day, [ month, year ] as month',
  'OPTIONAL MATCH (entry)-[:FROM]->(week:Week)-[:WEEK_OF]->(year:Year)',
  'WITH entry, project, day, month, [ week, year ] as week',
  'OPTIONAL MATCH (entry)-[:FROM]->(year:Year)',
  'WITH entry, project, day, month, week, year',
];

const RETURN_ENTRY = [
  'RETURN entry, project.id as project, day, month, year, week',
];

const transformEntry = function () {
  return this::map( r => Entry( r.get( 'entry' ), {
    project: r.get( 'project' ),
    day: r.get( 'day' ),
    month: r.get( 'month' ),
    week: r.get( 'week' ),
    year: r.get( 'year' ),
  }));
};

const createDateQuery = ( year, month, week, day ) => {
  const dateParams = {};
  let dateQuery = [];

  if ( year ) {
    dateParams.year = year.year;

    dateQuery = [
      'MATCH (t:Year {year:{year}})',
    ];
  } else if ( month ) {
    dateParams.year = month.year;
    dateParams.month = month.month;

    dateQuery = [
      'MATCH (:Year {year:{year}})<-[:MONTH_OF]-(t:Month {month:{month}})',
    ];
  } else if ( day ) {
    dateParams.year = day.year;
    dateParams.month = day.month;
    dateParams.day = day.day;

    dateQuery = [
      'MATCH (:Year {year:{year}})<-[:MONTH_OF]-(:Month {month:{month}})<-[:DAY_OF]-(t:Day {day:{day}})',
    ];
  } else if ( week ) {
    dateParams.year = week.year;
    dateParams.week = week.week;

    dateQuery = [
      'MATCH (:Year {year:{year}})<-[:WEEK_OF]-(t:Week {week:{week}})',
    ];
  }

  if ( dateQuery ) {
    dateQuery = [
      'WITH entry, project',
      ...dateQuery,
      'CREATE (t)<-[:FROM]-(entry)',
      'WITH entry, project',
    ];
  }

  return [ dateQuery, dateParams ];
};

const api = Router();
export default api;

api.get( '/', ( req, res ) => {
  const filters = {
    start: 0,
    limit: 10,
    recursive_dates: false,
    count: false,

    ...req.query,
  };

  const labels = [ filters.type, 'Entry', ].filter( l => l ).join( ':' );
  const count = isTruthyParam( filters.count );
  const recursive_dates = isTruthyParam( filters.recursive_dates );

  let dateQuery = [];
  if ( filters.year ) {
    filters.year = parseInt( filters.year, 10 );

    if ( filters.month ) {
      filters.month = parseInt( filters.month, 10 );

      if ( filters.day ) {
        filters.day = parseInt( filters.day, 10 );

        dateQuery = [
          'WHERE (entry)-[:FROM]->(:Day {day:{day}})-[:DAY_OF]->(:Month {month:{month}})-[:MONTH_OF]->(:Year {year:{year}})',
        ];
      } else {
        dateQuery = recursive_dates ? [
          'WHERE (entry)-[:FROM]->(:Day)-[:DAY_OF]->(:Month{month:{month}})-[:MONTH_OF]->(:Year {year:{year}})',
          '  OR (entry)-[:FROM]->(:Month {month:{month}})-[:MONTH_OF]->(:Year {year:{year}})',
        ] : [
          'WHERE (entry)-[:FROM]->(:Month {month:{month}})-[:MONTH_OF]->(:Year {year:{year}})',
        ];
      }
    } else if ( filters.week ) {
      filters.week = parseInt( filters.week, 10 );

      dateQuery = [
        'WHERE (entry)-[:FROM]->(week:Week {week:{week}})-[:WEEK_OF]->(year:Year {year:{year}})',
      ];
    } else {
      dateQuery = recursive_dates ? [
        'WHERE (entry)-[:FROM]->(:Day)-[:DAY_OF]->(:Month)-[:MONTH_OF]->(:Year {year:{year}})',
        '  OR (entry)-[:FROM]->(:Month)-[:MONTH_OF]->(:Year {year:{year}})',
        '  OR (entry)-[:FROM]->(:Year {year:{year}})',
      ] : [
        'WHERE (entry)-[:FROM]->(:Year {year:{year}})',
      ];
    }

    dateQuery.push( 'WITH project, entry' );
  }

  // FIXME: prevent injection attacks
  let q = [
    `MATCH (entry:${labels})-[:CREATED_BY]->(user:User {id:{userId}})`,
    filters.project
      ? `MATCH (project:Project {id:'${filters.project}'})<-[:OF]-(entry)`
      : 'OPTIONAL MATCH (project:Project)<-[:OF]-(entry)',
    'WITH project, entry',
    ...dateQuery,
  ];

  if ( count ) {
    q = [
      ...q,
      'return count( entry ) as entries',
    ];
  } else {
    q = [
      ...q,
      ...ENTRY_WITH_DATES,
      ...RETURN_ENTRY,
      'ORDER BY entry.created_at',
      `SKIP ${filters.start} LIMIT ${filters.limit}`,
    ];
  }

  let res$ = query( q, {
    ...filters,
    userId: req.user.id,
  });

  if ( ! count ) {
    res$ = res$
      ::map( r => Entry( r.get( 'entry' ), {
        project: r.get( 'project' ),
        day: r.get( 'day' ),
        month: r.get( 'month' ),
        week: r.get( 'week' ),
        year: r.get( 'year' ),
      }))
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

  const [ dateQuery, dateParams ] = createDateQuery( req.body.year, req.body.month, req.body.week, req.body.day );

  const labels = [
    ...( req.body.types || [] ).filter( l => ENTRY_TYPES.some( t => l === t ) ),
    'Entry',
  ].join( ':' );

  const project = req.body.project;

  // TODO: add validations

  const q = [
    'MATCH (user:User {id:{userId}})',
    project && 'MATCH (project:Project {id:{projectId}})',
    'CREATE (entry {entry})-[:CREATED_BY]->(user)',
    project && 'CREATE (project)<-[:OF]-(entry)',
    'SET entry.created_at = timestamp()',
    'SET entry.updated_at = timestamp()',
    `SET entry:${labels}`,
    ...dateQuery,
    ...ENTRY_WITH_DATES,
    ...RETURN_ENTRY,
  ];

  query( q, {
    userId: req.user.id,
    projectId: project,
    entry,
    ...dateParams,
  })
  ::transformEntry()
  ::send( res, 'entry' )
  ;
});

api.get( '/:id', ( req, res ) => {
  const { id } = req.params;
  const userId = req.user.id;

  query([
    'MATCH (entry:Entry {id:{id}})-[:CREATED_BY]->(user:User {id:{userId}})',
    'OPTIONAL MATCH (project:Project)<-[:OF]-(entry)',
    ...ENTRY_WITH_DATES,
    ...RETURN_ENTRY,
  ], { id, userId })
  ::transformEntry()
  ::send( res, 'entry' )
  ;
});

api.patch( '/:id', ( req, res ) => {
  const { id } = req.params;
  const userId = req.user.id;

  const props = filterProps( req.body, UPDATE_ENTRY_PROPS );

  // TODO: add validations
  // TODO: allow changing entity types?
  // TODO: allow changing project

  let [ dateQuery, dateParams ] = createDateQuery( req.body.year, req.body.month, req.body.week, req.body.day );

  if ( dateQuery.length ) {
    dateQuery = [
      'WITH entry, project',
      'OPTIONAL MATCH (entry)-[daterel:FROM]-(n)',
      'WHERE n:Year OR n:Month OR n:Week OR n:Day',
      'DELETE daterel',
      ...dateQuery,
    ];
  }

  query([
    'MATCH (entry:Entry {id:{id}})-[:CREATED_BY]->(user:User {id:{userId}})',
    'SET entry += {props}',
    'SET entry.updated_at = timestamp()',
    'WITH entry',
    'OPTIONAL MATCH (project:Project)<-[:OF]-(entry)',
    ...dateQuery,
    ...ENTRY_WITH_DATES,
    ...RETURN_ENTRY,
  ], {
    id,
    userId,
    props,
    ...dateParams,
  })
  ::transformEntry()
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

