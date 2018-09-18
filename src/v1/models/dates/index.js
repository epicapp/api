const ValueNodeFactory = label => ({ labels, properties }) => ({
  [label]: properties[label].toNumber(),
});

export const DayNode = ValueNodeFactory( 'day' );
export const MonthNode = ValueNodeFactory( 'month' );
export const WeekNode = ValueNodeFactory( 'week' );

export const Year = ValueNodeFactory( 'year' );

export const Month = ( monthNode, yearNode ) => ({
  ...MonthNode( monthNode ),
  ...Year( yearNode ),
});

export const Week = ( weekNode, yearNode ) => ({
  ...WeekNode( weekNode ),
  ...Year( yearNode ),
});

export const Day = ( dayNode, monthNode, yearNode ) => {
  const month = Month( monthNode, yearNode );
  const day = DayNode( dayNode );

  return {
    date: new Date( month.year, month.month - 1, day.day ),
    ...day,
    ...month,
  };
};

