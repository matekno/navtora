# Ground truth per set

- `shannon.json`: standard layout; `offset` maps file number to column number.
- For sets with a non-standard layout (kokhav, makhonot, bl1462), `columns` will be generated from the
  pipeline's confident results plus manual review of 20 columns per set. Until then, eval on those sets
  reports only the status (confident/ambiguous/insufficient) and the predicted position, without scoring hits.
