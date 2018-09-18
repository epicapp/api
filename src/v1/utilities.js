export const filterProps = function ( object = {}, props = [] ) {
  return props
    .reduce( ( o, prop ) => ({ ...o, [prop]: object[prop] }), {});
};

export const isTruthyParam = p => ( p !== false ) && [ '0', 'false', 'off' ].every( v => v !== p );

