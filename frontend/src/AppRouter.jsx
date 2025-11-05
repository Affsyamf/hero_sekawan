import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalFilterProvider } from "./contexts/GlobalFilterContext.jsx";
import "./assets/styles/tailwind.css";
import {
  Dashboard,
  AccountsPage,
  DesignsPage,
  DesignTypesPage,
  SuppliersPage,
  PurchasingsPage,
  ProductsPage,
  StockMovementsPage,
  ColorKitchensPage,
  StockOpnamePage,
  PurchasingReportsPage,
  OverviewNew,
  DashboardPurchasing,
  DashboardColorKitchen,
  ColorKitchenDetailPage,
  PurchasingDetailPage,
} from "./pages";
import GlobalFilterDrawer from "./components/common/GlobalFilterDrawer.jsx";
import AccountCategoryBoard from "./pages/account/AccountCategoryBoard.jsx";
import { MainLayout } from "./layouts/index.js";
import { FilterServiceProvider } from "./contexts/FilterServiceContext.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <GlobalFilterProvider>
          <FilterServiceProvider>
            <GlobalFilterDrawer />
            <Routes>
              <Route path="/dashboard/overview" element={<OverviewNew />} />
              <Route
                path="/dashboard/purchasings"
                element={<DashboardPurchasing />}
              />
              <Route
                path="/dashboard/color-kitchens"
                element={<DashboardColorKitchen />}
              />

              <Route path="/products" element={<ProductsPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />

              <Route path="/accounts" element={<AccountsPage />} />
              <Route
                path="/accounts/category-board"
                element={<AccountCategoryBoard />}
              />

              <Route path="/designs" element={<DesignsPage />} />
              <Route path="/design-types" element={<DesignTypesPage />} />

              <Route path="/purchasings" element={<PurchasingsPage />} />
              <Route
                path="/purchasings/detail/:id"
                element={<PurchasingDetailPage />}
              />

              <Route path="/stock-movements" element={<StockMovementsPage />} />

              <Route path="/color-kitchens" element={<ColorKitchensPage />} />
              <Route
                path="/color-kitchens/detail/:id"
                element={<ColorKitchenDetailPage />}
              />

              <Route path="/stock-opnames" element={<StockOpnamePage />} />

              <Route
                path="/reports/purchasings"
                element={<PurchasingReportsPage />}
              />
            </Routes>
          </FilterServiceProvider>
        </GlobalFilterProvider>
      </MainLayout>
    </BrowserRouter>
  );
}
