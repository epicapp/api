export default ({ labels, properties }, { project } = {} ) => ({
  ...properties,
  types: labels.filter( l => l != 'Entry' ),
  project: project || undefined,
  created_at: new Date( properties.created_at.toNumber() ),
  updated_at: new Date( properties.updated_at.toNumber() ),
});

