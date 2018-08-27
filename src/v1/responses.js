const send = ( res, payload, key = 'data', code = 200 ) => res.status( code )
  .send({
    [key]: payload,
  });

export default function ( res, key ) {
  let sent = false;

  return this.subscribe(
    record => {
      if ( ! sent ) {
        sent = true;
        send( res, record, key );
      }
    },

    error => {
      // TODO: add more sophisticated processing to check for error codes and so forth
      console.log( 'Error:' );
      console.log( error );
      send( res, 'An unexpected error occurred', 'error', 500 );
    }
  );
};

