import { Observable } from 'rxjs/Observable';
import { share } from 'rxjs/operator/share';
import { concatMap } from 'rxjs/operator/concatMap';
import neo4j from 'neo4j-driver';

const driver = neo4j.driver( 'bolt://localhost' );

export const query = ( text, parameters ) => {
  const session = driver.session();

  if ( Array.isArray( text ) ) {
    text = text.join( "\n" );
  }

  return new Observable( observer => {
    session.run( text, parameters ).subscribe({
      onNext ( record ) {
        observer.next( record );
      },

      onCompleted () {
        observer.complete();
      },

      onError ( error ) {
        observer.error( error );
      },
    });
  
    return () => session.close();
  });
};

