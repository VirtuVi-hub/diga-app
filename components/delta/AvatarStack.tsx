type AvatarPerson = { name: string; initials: string };

export function AvatarStack({ people, max = 3 }: { people: AvatarPerson[]; max?: number }) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div
      className="flex items-center"
      title={people.map((person) => person.name).join(", ")}
    >
      {visible.map((person, index) => (
        <span
          key={`${person.name}-${index}`}
          style={{ marginLeft: index === 0 ? 0 : -8, zIndex: visible.length - index }}
          className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-surface-primary bg-accent-muted text-[10px] font-bold text-accent-primary"
        >
          {person.initials}
        </span>
      ))}

      {overflow > 0 && (
        <span
          style={{ marginLeft: -8 }}
          className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-surface-primary bg-border-strong text-[10px] font-bold text-text-primary"
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
