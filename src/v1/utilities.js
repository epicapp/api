export const filterProps = function ( object = {}, props = [] ) {
  return props
    .reduce( ( o, prop ) => ({ ...o, [prop]: object[prop] }), {});
};

