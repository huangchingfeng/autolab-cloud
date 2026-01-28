import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import { BlogCategory } from "./pages/BlogCategory";
import { BlogTag } from "./pages/BlogTag";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPosts from "./pages/admin/Posts";
import PostEditor from "./pages/admin/PostEditor";
import CategoriesAndTags from "./pages/admin/CategoriesAndTags";
import AdminContacts from "./pages/admin/Contacts";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import BNIEventPage from "./pages/BNIEventPage";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import CorporateTraining from "./pages/CorporateTraining";
import PublicCourses2026 from "./pages/PublicCourses2026";
import AIBusinessFlywheel from "./pages/AIBusinessFlywheel";
import Coaching from "./pages/Coaching";
import Topics from "./pages/Topics";
import PromptLibrary from "./pages/PromptLibrary";
import Clients from "./pages/Clients";
import AdminEvents from "./pages/admin/Events";
import AdminRegistrations from "./pages/admin/Registrations";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LearningCenter from "./pages/LearningCenter";
import CourseViewer from "./pages/CourseViewer";
import AdminVideoCourses from "./pages/admin/VideoCourses";
import VideoCourseEditor from "./pages/admin/VideoCourseEditor";
import AdminVideoCoursePurchases from "./pages/admin/VideoCoursePurchases";
import VideoCoursePurchaseDashboard from "./pages/admin/VideoCourseDashboard";
import PaymentResult from "./pages/PaymentResult";
import AdminPromoCodes from "./pages/admin/PromoCodes";
import Course2026Registrations from "./pages/admin/Course2026Registrations";
import Course2026SessionRoster from "./pages/admin/Course2026SessionRoster";
import Course2026Sessions from "./pages/admin/Course2026Sessions";
import PaymentRecords from "./pages/PaymentRecords";
import AdminNotifications from "./pages/admin/Notifications";
import EventRegistrations from "./pages/admin/EventRegistrations";
import Course2026PaymentResult from "./pages/Course2026PaymentResult";
import { LineChatPlugin } from "./components/LineChatPlugin";
import SocialMediaButtons from "./components/SocialMediaButtons";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/about"} component={About} />
      <Route path={"/corporate-training"} component={CorporateTraining} />
      <Route path={"/public-courses"}>
        {() => <Redirect to="/2026-ai-course" />}
      </Route>
      <Route path={"/2026-ai-course"} component={PublicCourses2026} />
      <Route path={"/ai-business-flywheel"} component={AIBusinessFlywheel} />
      <Route path={"/coaching"} component={Coaching} />
      <Route path={"/topics"} component={Topics} />
      <Route path={"/prompt-library"} component={PromptLibrary} />
      <Route path={"/clients"} component={Clients} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/blog/category/:slug"} component={BlogCategory} />
      <Route path={"/blog/tag/:slug"} component={BlogTag} />
      <Route path={"/blog/:slug"} component={BlogPost} />
      <Route path={"/events"} component={Events} />
      <Route path="/events/bni/:slug" component={BNIEventPage} />
      <Route path="/events/:slug" component={EventDetail} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/2026" component={PublicCourses2026} />
      <Route path="/courses/:slug" component={CourseDetail} />
      <Route path="/learning" component={LearningCenter} />
      <Route path="/learning/:courseId" component={CourseViewer} />
      <Route path={"/testimonials"} component={Testimonials} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/faq"} component={FAQ} />
      <Route path="/payment-result" component={PaymentResult} />
      <Route path="/course-2026-payment-result" component={Course2026PaymentResult} />
      
      {/* Admin Routes */}
      <Route path={"/admin"}>
        {() => (
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/posts">
        {() => (
          <AdminLayout>
            <AdminPosts />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/posts/:id">
        {() => (
          <AdminLayout>
            <PostEditor />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/categories">
        {() => (
          <AdminLayout>
            <CategoriesAndTags />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/tags">
        {() => (
          <AdminLayout>
            <CategoriesAndTags />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/contacts">
        {() => (
          <AdminLayout>
            <AdminContacts />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/events">
        {() => (
          <AdminLayout>
            <AdminEvents />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/registrations">
        {() => (
          <AdminLayout>
            <AdminRegistrations />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/event-registrations">
        {() => (
          <AdminLayout>
            <EventRegistrations />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/video-courses">
        {() => (
          <AdminLayout>
            <AdminVideoCourses />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/video-courses/new">
        {() => (
          <AdminLayout>
            <VideoCourseEditor />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/video-courses/:id">
        {() => (
          <AdminLayout>
            <VideoCourseEditor />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/video-purchases">
        {() => (
          <AdminLayout>
            <AdminVideoCoursePurchases />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/video-dashboard">
        {() => (
          <AdminLayout>
            <VideoCoursePurchaseDashboard />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/promo-codes">
        {() => (
          <AdminLayout>
            <AdminPromoCodes />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/notifications">
        {() => (
          <AdminLayout>
            <AdminNotifications />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/course2026-registrations">
        {() => (
          <AdminLayout>
            <Course2026Registrations />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/course2026-roster">
        {() => (
          <AdminLayout>
            <Course2026SessionRoster />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/course2026-sessions">
        {() => (
          <AdminLayout>
            <Course2026Sessions />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/payment-records">
        {() => (
          <AdminLayout>
            <PaymentRecords />
          </AdminLayout>
        )}
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <LineChatPlugin />
          <SocialMediaButtons />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
