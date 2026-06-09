const TEAM_NUMBER_PATTERN = /^Team\s+(\d+)$/i;

export function numberedTeamName(index: number) {
  return `Team ${index + 1}`;
}

export function teamNameMap(sourceNames: string[]) {
  const map = new Map<string, string>();

  sourceNames
    .filter(Boolean)
    .forEach((name) => {
      if (!map.has(name)) {
        map.set(name, numberedTeamName(map.size));
      }
    });

  return map;
}

export function renumberTeamName(name: string, map: Map<string, string>) {
  return map.get(name) ?? name;
}

export function sortTeamNames(names: string[]) {
  return [...names].sort((a, b) => {
    const aNumber = TEAM_NUMBER_PATTERN.exec(a)?.[1];
    const bNumber = TEAM_NUMBER_PATTERN.exec(b)?.[1];

    if (aNumber && bNumber) {
      return Number(aNumber) - Number(bNumber);
    }

    return a.localeCompare(b);
  });
}
