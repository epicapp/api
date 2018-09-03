const send = ( res, payload, key, code = 200 ) => res.status( code )
  .send( key ? { [key]: payload } : payload );

export const SUCCESSFULLY_DELETED = {
  message: 'Successfully deleted'
};

export default function ( res, key, code, props ) {
  let sent = false;

  return this.subscribe(
    payload => {
      if ( ! sent ) {
        sent = true;
        send( res, payload, key, code );
      }
    },

    error => {
      // TODO: add more sophisticated processing to check for error codes and so forth
      console.log( 'Error:' );
      console.log( error );
      send( res, 'An unexpected error occurred', 'error', 500 );
    },

    () => {
      if ( ! sent ) {
        sent = true;
        send( res, 'Not Found', 'error', 404 );
      }
    }
  );
};

