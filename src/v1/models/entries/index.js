import { Day, Month, Week, Year } from '../dates';

export default ({ labels, properties }, {
  project,
  year,
  week,
  month,
  day,
} = {} ) => {
  let entry = {
    ...properties,

    project: project || undefined,
    types: labels.filter( l => l != 'Entry' ),

    day: day[0] ? Day( ...day ) : undefined,
    month: month[0] ? Month( ...month ) : undefined,
    week: week[0] ? Week( ...week ) : undefined,
    year: year ? Year( year ): undefined,

    created_at: new Date( properties.created_at.toNumber() ),
    updated_at: new Date( properties.updated_at.toNumber() ),
  };

  return entry;
};

