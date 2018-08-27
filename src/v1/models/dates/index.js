const ValueNodeFactory = label => ({ labels, properties }) => ({
  [label]: properties[label].toNumber(),
});

export const Day = ValueNodeFactory( 'day' );
export const Month = ValueNodeFactory( 'month' );
export const Year = ValueNodeFactory( 'year' );
export const Week = ValueNodeFactory( 'week' );

export const Dt = ( dayNode, monthNode, yearNode ) => {
  const day = Day( dayNode );
  const month = Month( monthNode );
  const year = Year( yearNode );

  return {
    dt: new Date( year.year, month.month - 1, day.day ),
    ...day,
    ...month,
    ...year,
  };
};

