import Image from 'next/image'

interface Props {
  /** media_url z bazy — null dla ćwiczeń bez ilustracji */
  src:   string | null | undefined
  emoji: string
  title: string
  /** Rozmiar w px do optymalizacji przez next/image; obraz i tak wypełnia rodzica. */
  size:  number
  priority?: boolean
}

/**
 * Ilustracja ćwiczenia z fallbackiem na emoji.
 *
 * Nie narzuca ramki — wypełnia kafelek rodzica i dziedziczy jego zaokrąglenie,
 * dzięki czemu w miejscach, gdzie dziś stoi emoji na kolorowym tle, wystarczy
 * podmienić zawartość. Rodzic potrzebuje `overflow-hidden`.
 *
 * Dopóki baza nie ma ilustracji (media_url jest puste dla wszystkich 127 ćwiczeń),
 * komponent zachowuje się dokładnie jak dotychczasowe emoji.
 */
export default function ExerciseImage({ src, emoji, title, size, priority = false }: Props) {
  if (!src) return <>{emoji}</>

  return (
    <Image
      src={src}
      alt={`Ilustracja: ${title}`}
      width={size}
      height={size}
      priority={priority}
      className="w-full h-full object-cover rounded-[inherit]"
    />
  )
}
