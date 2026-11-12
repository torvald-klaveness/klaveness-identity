import Link from "next/link";

// Same text as the old site's 404 page (minus its link to Squarespace's search page).
export default function NotFound() {
  return (
    <div className="system-page" data-section-theme="white">
      <div className="text">
        <p>We couldn&rsquo;t find the page you were looking for. This is either because:</p>
        <ul>
          <li>There is an error in the URL entered into your web browser. Please check the URL and try again.</li>
          <li>The page you are looking for has been moved or deleted.</li>
        </ul>
        <p>
          You can return to our homepage by <Link href="/">clicking here</Link>.
        </p>
      </div>
    </div>
  );
}
