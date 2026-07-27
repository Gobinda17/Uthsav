// Shapes a lean Mongo document into the plain `{ id, ...fields }` shape the
// API has always returned (matches the old SQLite row shape).
function serialize(doc) {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

module.exports = { serialize };
