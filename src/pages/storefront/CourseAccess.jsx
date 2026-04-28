import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/common/Footer";
import RichTextContent from "../../components/ui/RichTextContent";
import SiteLoadingScreen from "../../components/storefront/SiteLoadingScreen";
import { loadCourseByToken } from "../../services/courseAccess";
import { useAuth } from "../../context/AuthContext";
import CourseViewer from "../../components/storefront/CourseViewer/CourseViewer";

const getYouTubeEmbedUrl = (url) => {
  const value = String(url || "").trim();
  const match = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : value;
};

const CourseItem = ({ item }) => {
  const fileUrl = item.signedUrl || item.fileUrl || item.externalUrl;

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">{item.contentType}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{item.title}</h2>
        </div>
        {item.allowDownload && fileUrl ? (
          <a
            href={fileUrl}
            download
            className="rounded-full border border-teal-300/40 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100"
          >
            Download
          </a>
        ) : null}
      </div>

      {item.description ? <p className="mt-3 text-sm leading-relaxed text-white/60">{item.description}</p> : null}
      {item.body ? <RichTextContent value={item.body} className="mt-5 text-base leading-relaxed text-white/75" /> : null}

      {item.contentType === "youtube" && item.youtubeUrl ? (
        <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <iframe
            src={getYouTubeEmbedUrl(item.youtubeUrl)}
            title={item.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}

      {item.contentType === "video" && fileUrl ? (
        <video controls className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40">
          <source src={fileUrl} />
        </video>
      ) : null}

      {item.contentType === "audio" && fileUrl ? (
        <audio controls className="mt-5 w-full">
          <source src={fileUrl} />
        </audio>
      ) : null}

      {item.contentType === "link" && fileUrl ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/75 hover:border-teal-300/40 hover:text-teal-100"
        >
          Open resource
        </a>
      ) : null}
    </article>
  );
};

const CourseAccess = () => {
  const { token } = useParams();
  const { user, isAuthenticated, login } = useAuth();
  const [state, setState] = useState({ status: "loading", data: null, error: "" });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;
    const load = async () => {
      try {
        const data = await loadCourseByToken(token);

        // Check if the authenticated user is the purchaser
        if (data?.access?.customerEmail && user?.email) {
          if (data.access.customerEmail.toLowerCase() !== user.email.toLowerCase()) {
            if (isMounted) {
              setState({
                status: "error",
                data: null,
                error: "This course access link is for a different user. Please log in with the correct account."
              });
            }
            return;
          }
        }

        if (isMounted) {
          setState({ status: "ready", data, error: "" });
        }
      } catch (error) {
        if (isMounted) {
          setState({ status: "error", data: null, error: error?.message || "Unable to open this course." });
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated, user]);

  const expiresLabel = useMemo(() => {
    const expiresAt = state.data?.access?.expiresAt;
    if (!expiresAt) {
      return "Lifetime access";
    }
    return `Access until ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(expiresAt))}`;
  }, [state.data?.access?.expiresAt]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navigation />
        <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-200/80">Authentication required</p>
          <h1 className="mt-4 text-4xl font-semibold">Please log in to access your course</h1>
          <p className="mt-4 text-white/65">You need to be logged in with the account that purchased this course to access the content.</p>
          <button
            onClick={() => login()}
            className="mt-8 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 hover:border-teal-200 hover:bg-teal-300/20"
          >
            Log in to continue
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navigation />
        <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-200/80">Access paused</p>
          <h1 className="mt-4 text-4xl font-semibold">This link cannot open the course</h1>
          <p className="mt-4 text-white/65">{state.error}</p>
          <Link to="/" className="mt-8 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100">
            Return home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (state.status === "loading" || !state.data) {
    return <SiteLoadingScreen title="Opening your course" description="Checking your access link and loading your content." />;
  }

  if (!state.data?.course) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navigation />
        <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-200/80">No course available</p>
          <h1 className="mt-4 text-4xl font-semibold">This course is not available</h1>
          <p className="mt-4 text-white/65">The course associated with this offering could not be found.</p>
          <Link to="/" className="mt-8 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100">
            Return home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { course, modules = [], items = [], access } = state.data;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navigation />
      <div className="flex-1 mt-20">
        <CourseViewer 
          course={course}
          modules={modules}
          items={items}
          access={access}
        />
      </div>
    </div>
  );
};

export default CourseAccess;
