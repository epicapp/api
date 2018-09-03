export default ({ labels, properties }) => ({
  ...properties,
  created_at: new Date( properties.created_at.toNumber() ),
  updated_at: new Date( properties.updated_at.toNumber() ),
});

