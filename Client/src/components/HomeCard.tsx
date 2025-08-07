export interface HomeDescription {
  home_id: string;
  description?: string;
  image_url?: string;
  [key: string]: any; // allow additional properties for future use
}

interface HomeCardProps {
  home: HomeDescription;
}

/**
 * Simple presentation component to display a saved home.
 * Can be enhanced later with images, price, address, etc.
 */
export default function HomeCard({ home }: HomeCardProps) {
  const placeholder = "https://placehold.co/600x400?text=No+Image";
  return (
    <div className="border rounded-lg shadow-sm bg-white hover:shadow-md transition overflow-hidden">
      {/* Image */}
      <div className="w-full h-48 bg-gray-100 overflow-hidden">
        <img
          src={home.image_url || placeholder}
          alt={home.description || `Home ${home.home_id}`}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate" title={home.home_id}>
          Home {home.home_id}
        </h3>
        {home.description && (
          <p className="text-sm text-gray-700 line-clamp-3">
            {home.description}
          </p>
        )}
      </div>
    </div>
  );
}
