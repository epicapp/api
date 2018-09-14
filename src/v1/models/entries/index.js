export default ({ labels, properties }) => ({
  ...properties,
  types: labels.filter( l => l != 'Entry' ),
  created_at: new Date( properties.created_at.toNumber() ),
  updated_at: new Date( properties.updated_at.toNumber() ),
});

