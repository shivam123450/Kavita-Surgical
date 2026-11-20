import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "./supabase";
import { business as defaultBusiness, normalizeWhatsAppNumber } from "./business";
import { ManagedImage } from "./ManagedImage";
import { deleteManagedImage, uploadManagedImage } from "./imageStorage";
import { formatPrice, getProductPricing } from "./productPricing";
import {
  deleteAdminProduct,
  fetchAdminProducts,
  saveAdminProduct,
  type AdminProduct,
  fetchCategories,
  saveCategory,
  deleteCategory,
  fetchFilterCategories,
  saveFilterCategory,
  deleteFilterCategory,
  fetchSiteImages,
  saveSiteImage,
  deleteSiteImage,
  saveProductImage,
  setPrimaryProductImage,
  setProductImagePublished,
  deleteProductImage,
  fetchHomepageSettings,
  saveHomepageSettings,
  saveFeaturedProductLimit,
  fetchBusinessSettings,
  saveBusinessSettings,
  type AdminCategory,
  type HomepageSettings,
  type BusinessSettings,
  type FilterCategory,
  type FilterCategoryDraft,
  type SiteImage,
} from "./catalogueStore";

const emptyProduct = (): AdminProduct => ({
  id: "",
  databaseId: undefined,
  sku: "",
  name: "",
  category: "Laparoscopic Instruments",
  categoryId: undefined,
  filterCategoryId: undefined,
  description: "",
  imageStoragePath: undefined,
  imageUrl: undefined,
  imageAlt: "",
  originalPrice: undefined,
  offerPrice: undefined,
  featured: false,
  featuredOrder: 0,
  published: false,
  sortOrder: 0,
  images: [],
  specifications: [],
});

function getErrorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof Error) return caught.message;
  if (caught && typeof caught === "object" && "message" in caught) {
    const message = caught.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export default function AdminDashboard() {
  const [sessionEmail, setSessionEmail] = useState("");
  const [sessionUserId, setSessionUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckError, setAdminCheckError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<AdminProduct | null>(null);
  const [priceInputs, setPriceInputs] = useState<{ original: string; offer: string } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
  const [filterCategoriesError, setFilterCategoriesError] = useState("");
  const [filterCategoriesLoading, setFilterCategoriesLoading] = useState(true);
  const [siteImages, setSiteImages] = useState<SiteImage[]>([]);
  const [siteImagesError, setSiteImagesError] = useState("");
  const [siteImageSection, setSiteImageSection] = useState<SiteImage["sectionKey"]>("about-visual");
  const [siteImageDraftPath, setSiteImageDraftPath] = useState("");
  const [siteImageDraft, setSiteImageDraft] = useState<SiteImage>({
    sectionKey: "about-visual",
    storagePath: "",
    altText: "",
    sortOrder: 0,
    published: false,
  });
  const [homepageImageDraftPath, setHomepageImageDraftPath] = useState("");
  const [categoryImageDraftPath, setCategoryImageDraftPath] = useState("");
  const homepagePersistedImagePath = useRef("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [categoryDraft, setCategoryDraft] = useState<AdminCategory | null>(null);
  const [filterCategoryDraft, setFilterCategoryDraft] = useState<FilterCategoryDraft | null>(null);
  const [homepage, setHomepage] = useState<HomepageSettings>({
    id: "homepage",
    heroTitle: "",
    heroSubtitle: "",
    heroImageStoragePath: "",
    heroImageUrl: "",
    heroImageAlt: "",
    heroImagePublished: false,
    featuredProductLimit: 3,
    featuredProductIds: [],
  });
  const [featuredPreviewId, setFeaturedPreviewId] = useState("");
  const [business, setBusiness] = useState<BusinessSettings>({
    id: "business",
    name: "",
    gstin: "",
    phone: defaultBusiness.phone,
    whatsapp: defaultBusiness.whatsappNumber,
    email: "",
    address: "",
    instagram: "",
    facebook: "",
    linkedin: "",
  });
  const draftRef = useRef<AdminProduct | null>(null);

  const openProductDraft = (product: AdminProduct) => {
    setDraft(product);
    setPriceInputs({
      original: product.originalPrice === undefined ? "" : String(product.originalPrice),
      offer: product.offerPrice === undefined ? "" : String(product.offerPrice),
    });
  };

  const closeProductDraft = () => {
    setDraft(null);
    setPriceInputs(null);
  };

  const parsePrice = (value: string, label: string): number | undefined => {
    if (value === "") return undefined;
    if (!/^\d*\.?\d*$/.test(value) || value === ".") {
      throw new Error(`${label} must be a non-negative number.`);
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error(`${label} must be a non-negative number.`);
    }
    return parsed;
  };

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const loadProducts = useCallback(async () => {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      setProducts(await fetchAdminProducts());
    } catch (caught) {
      setError(`Unable to load products: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  }, []);

  const loadFilterCategories = useCallback(async () => {
    setFilterCategoriesLoading(true);
    try {
      setFilterCategories(await fetchFilterCategories());
      setFilterCategoriesError("");
    } catch (caught) {
      setFilterCategories([]);
      setFilterCategoriesError(getErrorMessage(caught, "Unknown Supabase error."));
    } finally {
      setFilterCategoriesLoading(false);
    }
  }, []);

  const loadSiteImages = useCallback(async () => {
    try {
      setSiteImages(await fetchSiteImages());
      setSiteImagesError("");
    } catch (caught) {
      setSiteImages([]);
      setSiteImagesError(getErrorMessage(caught, "Unknown Supabase error."));
    }
  }, []);

  const loadContent = useCallback(async () => {
    if (!supabase) return;
    try {
      setCategories(await fetchCategories());
      setCategoriesError("");
    } catch (caught) {
      setCategoriesError(getErrorMessage(caught, "Unknown Supabase error."));
    }
    await loadFilterCategories();
    await loadSiteImages();
    try {
      const [homepageSettings, businessSettings] = await Promise.all([
        fetchHomepageSettings(),
        fetchBusinessSettings(),
      ]);
      if (homepageSettings) {
        setHomepage(homepageSettings);
        homepagePersistedImagePath.current = homepageSettings.heroImageStoragePath;
      }
      if (businessSettings) setBusiness(businessSettings);
    } catch (caught) {
      setError(`Unable to load homepage or business settings: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    }
  }, [loadFilterCategories, loadSiteImages]);

  const checkAdmin = useCallback(async (userId: string | undefined) => {
    if (!supabase || !userId) {
      setIsAdmin(false);
      setAdminCheckError("");
      return false;
    }
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    setAdminCheckError(error?.message ?? "");
    const allowed = !error && Boolean(data);
    setIsAdmin(allowed);
    return allowed;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase environment variables are not configured.");
      return;
    }
    supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          setError(`Unable to restore the admin session: ${sessionError.message}`);
          return;
        }
        const session = data.session;
        setSessionEmail(session?.user.email ?? "");
        setSessionUserId(session?.user.id ?? "");
        void checkAdmin(session?.user.id).then((allowed) => {
          if (allowed) {
            void loadProducts();
            void loadContent();
          }
        }).catch((caught: unknown) => {
          setAdminCheckError(getErrorMessage(caught, "Unknown authentication error."));
        });
      })
      .catch((caught: unknown) => {
        setError(`Unable to restore the admin session: ${getErrorMessage(caught, "Unknown authentication error.")}`);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? "");
      setSessionUserId(session?.user.id ?? "");
      setIsAdmin(false);
      setAdminCheckError("");
      if (session) {
        void checkAdmin(session.user.id).then((allowed) => {
          if (allowed) {
            void loadProducts();
            void loadContent();
          }
        }).catch((caught: unknown) => {
          setAdminCheckError(getErrorMessage(caught, "Unknown authentication error."));
        });
      } else {
        setProducts([]);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [checkAdmin, loadContent, loadProducts]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
    } catch (caught) {
      setError(`Unable to sign in: ${getErrorMessage(caught, "Unknown authentication error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) setError(`Unable to sign out: ${signOutError.message}`);
    } catch (caught) {
      setError(`Unable to sign out: ${getErrorMessage(caught, "Unknown authentication error.")}`);
    }
  };

  const uploadImage = async (file: File) => {
    const currentDraft = draftRef.current;
    if (!supabase || !currentDraft) return;
    setBusy(true);
    setError("");
    let path: string | undefined;
    try {
      path = await uploadManagedImage(file, "products");
      let savedProductId = currentDraft.databaseId;
      if (!savedProductId) {
        savedProductId = await saveAdminProduct(currentDraft);
        const createdDraft = { ...currentDraft, databaseId: savedProductId, id: savedProductId };
        draftRef.current = createdDraft;
        setDraft(createdDraft);
        await loadProducts();
      }
      const imageId = await saveProductImage(savedProductId, {
        storagePath: path,
        altText: currentDraft.imageAlt || currentDraft.name,
        sortOrder: currentDraft.images.length,
        isPrimary: currentDraft.images.length === 0,
        published: false,
      });
      const updatedDraft = {
        ...currentDraft,
        databaseId: savedProductId,
        id: savedProductId,
        imageStoragePath: currentDraft.images.length === 0 ? path : currentDraft.imageStoragePath,
        images: [
          ...currentDraft.images,
          {
            id: imageId,
            storagePath: path,
            altText: currentDraft.imageAlt || currentDraft.name,
            sortOrder: currentDraft.images.length,
            isPrimary: currentDraft.images.length === 0,
            published: false,
          },
        ],
      };
      draftRef.current = updatedDraft;
      setDraft(updatedDraft);
    } catch (caught) {
      if (path) {
        try {
          await deleteManagedImage(path);
        } catch (cleanupError) {
          setError(
            `Unable to attach image: ${getErrorMessage(caught, "Unknown Supabase error.")}. Cleanup also failed: ${getErrorMessage(cleanupError, "Unknown Supabase error.")}`,
          );
          setBusy(false);
          return;
        }
      }
      setError(`Unable to attach image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setError("");
    setNotice("");
    if (!draft.filterCategoryId) {
      setError("Select a published filter category before saving this product.");
      return;
    }
    if (
      draft.gstRate !== undefined &&
      (!Number.isFinite(draft.gstRate) || draft.gstRate < 0 || draft.gstRate > 100)
    ) {
      setError("GST rate must be between 0 and 100.");
      return;
    }
    try {
      const productToSave = {
        ...draft,
        originalPrice: parsePrice(priceInputs?.original ?? "", "Original price"),
        offerPrice: parsePrice(priceInputs?.offer ?? "", "Offer price"),
      };
      setBusy(true);
      const savedId = await saveAdminProduct(productToSave);
      if (!productToSave.databaseId) {
        setDraft({ ...productToSave, databaseId: savedId, id: savedId });
      }
      closeProductDraft();
      await loadProducts();
      setNotice("Product saved successfully.");
    } catch (caught) {
      setError(`Unable to save product: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (product: AdminProduct) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteAdminProduct(product);
      await loadProducts();
      setNotice("Product deleted successfully.");
    } catch (caught) {
      setError(`Unable to delete product: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const removeDraftImage = async (imageIndex: number) => {
    if (!draft) return;
    const image = draft.images[imageIndex];
    if (!image) return;
    if (!window.confirm("Remove this image?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteProductImage(image);
      const remaining = draft.images
        .filter((_, index) => index !== imageIndex)
        .map((item, index) => ({
          ...item,
          sortOrder: index,
          isPrimary: false,
        }));
      const nextPrimary = remaining[0];
      const images = remaining.map((item, index) => ({
        ...item,
        isPrimary: index === 0,
      }));
      if (nextPrimary?.id && draft.databaseId) {
        await setPrimaryProductImage(draft.databaseId, nextPrimary.id);
      }
      setDraft({
        ...draft,
        imageStoragePath: nextPrimary?.storagePath,
        imageUrl: nextPrimary?.url || (draft.imageUrl === image.url ? undefined : draft.imageUrl),
        images,
      });
      await loadProducts();
    } catch (caught) {
      setError(`Unable to remove image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const makePrimaryProductImage = async (image: AdminProduct["images"][number]) => {
    if (!draft?.databaseId || !image.id) return;
    setBusy(true);
    setError("");
    try {
      await setPrimaryProductImage(draft.databaseId, image.id);
      const images = draft.images.map((item) => ({
        ...item,
        isPrimary: item.id === image.id,
      }));
      setDraft({
        ...draft,
        imageStoragePath: image.storagePath,
        imageUrl: image.url || draft.imageUrl,
        images,
      });
      await loadProducts();
    } catch (caught) {
      setError(`Unable to set primary image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const markProductImagePrimary = async (
    product: AdminProduct,
    image: AdminProduct["images"][number],
  ) => {
    if (!product.databaseId || !image.id) return;
    setBusy(true);
    setError("");
    try {
      await setPrimaryProductImage(product.databaseId, image.id);
      await loadProducts();
    } catch (caught) {
      setError(`Unable to set primary image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const toggleProductImagePublished = async (
    product: AdminProduct,
    image: AdminProduct["images"][number],
  ) => {
    if (!product.databaseId || !image.id) return;
    setBusy(true);
    setError("");
    try {
      await setProductImagePublished(product.databaseId, image.id, !image.published);
      setProducts((current) => current.map((item) =>
        item.databaseId === product.databaseId
          ? {
              ...item,
              images: item.images.map((currentImage) =>
                currentImage.id === image.id
                  ? { ...currentImage, published: !image.published }
                  : currentImage,
              ),
            }
          : item,
      ));
      if (draft?.databaseId === product.databaseId) {
        setDraft((current) => current ? {
          ...current,
          images: current.images.map((currentImage) =>
            currentImage.id === image.id
              ? { ...currentImage, published: !image.published }
              : currentImage,
          ),
        } : current);
      }
    } catch (caught) {
      setError(`Unable to update image publication: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const saveCategoryDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryDraft) return;
    setBusy(true);
    setError("");
    setNotice("");
    const savedImagePath = categoryDraft.id
      ? categories.find((category) => category.id === categoryDraft.id)?.imageStoragePath
      : undefined;
    try {
      await saveCategory(categoryDraft);
      if (savedImagePath && savedImagePath !== categoryDraft.imageStoragePath) {
        await deleteManagedImage(savedImagePath);
      }
      setCategoryDraft(null);
      setCategoryImageDraftPath("");
      await loadContent();
      setNotice(categoryDraft.id ? "Category updated successfully." : "Category added successfully.");
    } catch (caught) {
      setError(`Unable to save category: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const removeCategory = async (category: AdminCategory) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteCategory(category);
      if (category.imageStoragePath) await deleteManagedImage(category.imageStoragePath);
      await loadContent();
      setNotice("Category deleted successfully.");
    } catch (caught) {
      setError(`Unable to delete category: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const uploadCategoryImage = async (file: File) => {
    if (!categoryDraft) return;
    setBusy(true);
    setError("");
    try {
      const newPath = await uploadManagedImage(file, "categories");
      const savedPath = categoryDraft.id
        ? categories.find((category) => category.id === categoryDraft.id)?.imageStoragePath
        : undefined;
      if (categoryImageDraftPath && categoryImageDraftPath !== savedPath) {
        await deleteManagedImage(categoryImageDraftPath);
      }
      setCategoryImageDraftPath(newPath);
      setCategoryDraft({ ...categoryDraft, imageStoragePath: newPath, imagePublished: false });
    } catch (caught) {
      setError(`Unable to upload category image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const closeCategoryDraft = () => {
    if (categoryImageDraftPath) {
      const savedPath = categoryDraft?.id
        ? categories.find((category) => category.id === categoryDraft.id)?.imageStoragePath
        : undefined;
      if (categoryImageDraftPath !== savedPath) {
        void deleteManagedImage(categoryImageDraftPath).catch((caught: unknown) =>
          setError(`Unable to clean up the unsaved category image: ${getErrorMessage(caught, "Unknown Supabase error.")}`),
        );
      }
    }
    setCategoryImageDraftPath("");
    setCategoryDraft(null);
  };

  const saveFilterCategoryDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!filterCategoryDraft) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveFilterCategory(filterCategoryDraft);
      setFilterCategoryDraft(null);
      await loadFilterCategories();
      setNotice(filterCategoryDraft.id
        ? "Filter category updated successfully."
        : "Filter category added successfully.");
    } catch (caught) {
      setError(`Unable to save filter category: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const removeFilterCategory = async (category: FilterCategory) => {
    const usageCount = products.filter((product) => product.filterCategoryId === category.id).length;
    if (usageCount > 0) {
      setError(
        `Cannot delete "${category.name}" because it is assigned to ${usageCount} product${usageCount === 1 ? "" : "s"}. Reassign those products first.`,
      );
      return;
    }
    if (!window.confirm(`Delete filter category "${category.name}"?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteFilterCategory(category);
      await loadFilterCategories();
      setNotice("Filter category deleted successfully.");
    } catch (caught) {
      setError(`Unable to delete filter category: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const saveHomepage = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveHomepageSettings(homepage);
      if (
        homepagePersistedImagePath.current &&
        homepagePersistedImagePath.current !== homepage.heroImageStoragePath
      ) {
        await deleteManagedImage(homepagePersistedImagePath.current);
      }
      homepagePersistedImagePath.current = homepage.heroImageStoragePath;
      setHomepageImageDraftPath("");
    } catch (caught) {
      setError(`Unable to save homepage: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
      return;
    } finally {
      setBusy(false);
    }
    setNotice("Homepage settings saved.");
  };

  const saveFeaturedStatus = async (product: AdminProduct, featured: boolean) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveAdminProduct({ ...product, featured });
      await loadProducts();
      setNotice(featured ? "Product added to Featured Instruments." : "Product removed from Featured Instruments.");
    } catch (caught) {
      setError(`Unable to update featured status: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const saveFeaturedOrder = async (product: AdminProduct, value: string) => {
    const featuredOrder = Number(value);
    if (!Number.isInteger(featuredOrder) || featuredOrder < 0) {
      setError("Featured display order must be a non-negative whole number.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveAdminProduct({ ...product, featuredOrder });
      await loadProducts();
      setNotice("Featured display order saved.");
    } catch (caught) {
      setError(`Unable to save featured display order: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
      await loadProducts();
    } finally {
      setBusy(false);
    }
  };

  const saveFeaturedLimit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveFeaturedProductLimit(homepage.featuredProductLimit);
      setNotice("Featured Instruments display limit saved.");
    } catch (caught) {
      setError(`Unable to save featured product limit: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const uploadHomepageImage = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const path = await uploadManagedImage(file, "homepage");
      if (homepageImageDraftPath) await deleteManagedImage(homepageImageDraftPath);
      setHomepageImageDraftPath(path);
      setHomepage((current) => ({
        ...current,
        heroImageStoragePath: path,
        heroImagePublished: false,
      }));
    } catch (caught) {
      setError(`Unable to upload homepage image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const chooseSiteImageSection = (sectionKey: SiteImage["sectionKey"]) => {
    if (siteImageDraftPath) {
      const savedPath = siteImages.find((image) => image.sectionKey === siteImageDraft.sectionKey)?.storagePath;
      if (siteImageDraftPath !== savedPath) {
        void deleteManagedImage(siteImageDraftPath).catch((caught: unknown) =>
          setError(`Unable to clean up the unsaved website image: ${getErrorMessage(caught, "Unknown Supabase error.")}`),
        );
      }
    }
    const savedImage = siteImages.find((image) => image.sectionKey === sectionKey);
    setSiteImageSection(sectionKey);
    setSiteImageDraftPath("");
    setSiteImageDraft(savedImage ?? {
      sectionKey,
      storagePath: "",
      altText: "",
      sortOrder: 0,
      published: false,
    });
  };

  const uploadSiteImage = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const path = await uploadManagedImage(file, "site");
      if (siteImageDraftPath) await deleteManagedImage(siteImageDraftPath);
      setSiteImageDraftPath(path);
      setSiteImageDraft((current) => ({
        ...current,
        sectionKey: siteImageSection,
        storagePath: path,
        published: false,
      }));
    } catch (caught) {
      setError(`Unable to upload website image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const saveSiteImageDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteImageDraft.storagePath) {
      setError("Upload an image and preview it before saving.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const previousPath = siteImages.find((image) => image.sectionKey === siteImageSection)?.storagePath;
    try {
      await saveSiteImage({ ...siteImageDraft, sectionKey: siteImageSection });
      if (previousPath && previousPath !== siteImageDraft.storagePath) {
        await deleteManagedImage(previousPath);
      }
      await loadSiteImages();
      setSiteImageDraftPath("");
      setNotice("Website image saved successfully.");
    } catch (caught) {
      setError(`Unable to save website image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const removeSiteImage = async (image: SiteImage) => {
    if (!window.confirm(`Delete the image assigned to ${image.sectionKey.replace(/-/g, " ")}?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteSiteImage(image);
      await deleteManagedImage(image.storagePath);
      await loadSiteImages();
      if (siteImageSection === image.sectionKey) {
        setSiteImageDraft({
          sectionKey: image.sectionKey,
          storagePath: "",
          altText: "",
          sortOrder: 0,
          published: false,
        });
      }
      setNotice("Website image deleted.");
    } catch (caught) {
      setError(`Unable to delete website image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
    } finally {
      setBusy(false);
    }
  };

  const saveBusiness = async (event: FormEvent) => {
    event.preventDefault();
    const whatsapp = normalizeWhatsAppNumber(business.whatsapp);
    if (business.whatsapp.trim() && !whatsapp) {
      setError("WhatsApp must be an international phone number or a valid https://wa.me/<number> link.");
      return;
    }
    for (const [label, value] of [
      ["Instagram", business.instagram],
      ["Facebook", business.facebook],
      ["LinkedIn", business.linkedin],
    ]) {
      if (!value.trim()) continue;
      try {
        if (new URL(value).protocol !== "https:") throw new Error();
      } catch {
        setError(`${label} URL must be a valid HTTPS URL.`);
        return;
      }
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveBusinessSettings({ ...business, whatsapp });
      setBusiness((current) => ({ ...current, whatsapp }));
    } catch (caught) {
      setError(`Unable to save business settings: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
      return;
    } finally {
      setBusy(false);
    }
    setNotice("Business information saved.");
  };

  const filteredProducts = products.filter((product) => {
    if (!productCategoryFilter) return true;
    if (productCategoryFilter === "__uncategorized__") {
      return !product.categoryId && !categories.some((category) => category.name === product.category);
    }
    const category = categories.find((item) => item.id === productCategoryFilter);
    return product.categoryId === productCategoryFilter ||
      (!product.categoryId && category?.name === product.category);
  });
  const featuredManagementProducts = [...products].sort((a, b) =>
    Number(b.featured) - Number(a.featured) ||
    a.featuredOrder - b.featuredOrder ||
    a.sortOrder - b.sortOrder ||
    a.name.localeCompare(b.name),
  );

  if (!supabase) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-not-configured">
          <h1>Admin setup required</h1>
          <p>Configure the Supabase environment variables before using the dashboard.</p>
          <a href="/" className="admin-button">Return to website</a>
        </section>
      </main>
    );
  }

  if (!sessionEmail) {
    return (
      <main className="admin-shell">
        <form className="admin-card admin-login" onSubmit={signIn}>
          <span className="admin-kicker">Kavita Surgical</span>
          <h1>Administrator sign in</h1>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button className="admin-button" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
          <a href="/" className="admin-back">Back to website</a>
        </form>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-not-configured">
          <h1>Access restricted</h1>
          {adminCheckError ? (
            <>
              <p role="alert">We could not verify this account's administrator access.</p>
              <p className="admin-error">{adminCheckError}</p>
              <p>Ask the Supabase project owner to verify that the database migrations are applied and that this account can read its own administrator record.</p>
            </>
          ) : (
            <>
              <p>This account is signed in, but it is not registered as an administrator.</p>
              <p>To securely configure the first administrator, ask the Supabase project owner to add this account's user ID to <code>public.admin_users</code> in the Supabase SQL Editor:</p>
              <code>insert into public.admin_users (user_id) values ('{sessionUserId}') on conflict (user_id) do nothing;</code>
              <p>This dashboard does not grant administrator access to signed-in users. Never run this statement from the browser or expose a service-role key.</p>
            </>
          )}
          <button type="button" className="admin-button" onClick={signOut}>Sign out</button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell admin-dashboard">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand"><strong>KAVITA</strong><span>SURGICAL</span></a>
        <nav aria-label="Admin navigation">
          {["Overview", "Products", "Categories", "Filter Categories", "Images", "Website Images", "Featured Instruments", "Homepage", "Business"].map((tab) => (
            <button
              type="button"
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <button type="button" className="admin-signout" onClick={signOut}>Sign out</button>
      </aside>
      <section className="admin-content">
        <header className="admin-header">
          <div><span>Dashboard</span><h1>{activeTab}</h1></div>
          {activeTab === "Products" && (
            <div className="admin-header-actions">
              <select
                className="admin-category-filter"
                aria-label="Filter products by category"
                value={productCategoryFilter}
                onChange={(event) => setProductCategoryFilter(event.target.value)}
                disabled={Boolean(categoriesError)}
              >
                <option value="">{categoriesError ? "Categories unavailable" : "All categories"}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                {!categoriesError && <option value="__uncategorized__">Uncategorized</option>}
              </select>
              <button type="button" className="admin-button" onClick={() => openProductDraft(emptyProduct())}>Add product</button>
            </div>
          )}
          {activeTab === "Categories" && (
            <button
              type="button"
              className="admin-button"
              onClick={() => setCategoryDraft({
                name: "",
                slug: "",
                description: "",
                image: "",
                imageAlt: "",
                imagePublished: false,
                sortOrder: categories.length,
                published: true,
              })}
            >
              Add category
            </button>
          )}
          {activeTab === "Filter Categories" && (
            <button
              type="button"
              className="admin-button"
              onClick={() => setFilterCategoryDraft({
                name: "",
                slug: "",
                description: "",
                sortOrder: filterCategories.length,
                published: true,
              })}
            >
              Add filter category
            </button>
          )}
        </header>
        {error && <p className="admin-error" role="alert">{error}</p>}
        {notice && <p className="admin-success" role="status">{notice}</p>}
        {activeTab === "Overview" && (
          <div className="admin-overview">
            <article><span>Total products</span><strong>{products.length}</strong></article>
            <article><span>Published</span><strong>{products.filter((product) => product.published).length}</strong></article>
            <article><span>Featured</span><strong>{products.filter((product) => product.featured).length}</strong></article>
            <article><span>Categories</span><strong>{categories.length}</strong></article>
          </div>
        )}
        {activeTab === "Products" && (
          <>
            {categoriesError && (
              <p className="admin-error" role="alert">
                Categories could not be loaded: {categoriesError}
                {/(PGRST205|schema cache|does not exist)/i.test(categoriesError)
                  ? " Apply supabase/migrations/202611200002_admin_content.sql in Supabase SQL Editor, then reload this dashboard."
                  : " Check the Supabase category table SELECT grant and RLS policies."}
              </p>
            )}
            {filterCategoriesError && (
              <p className="admin-error" role="alert">
                Filter categories could not be loaded: {filterCategoriesError}
                {/(PGRST205|schema cache|does not exist)/i.test(filterCategoriesError)
                  ? " Apply supabase/migrations/202611200003_filter_categories.sql in Supabase SQL Editor, then reload this dashboard."
                  : " Check the Supabase filter_categories SELECT grant and RLS policies."}
              </p>
            )}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.databaseId ?? product.id}>
                      <td><strong>{product.name}</strong><span>{product.description}</span></td>
                      <td>{product.sku}</td>
                      <td>{product.category}</td>
                      <td><span className={product.published ? "status-live" : "status-draft"}>{product.published ? "Published" : "Draft"}</span></td>
                      <td>
                        <button type="button" onClick={() => openProductDraft(product)}>Edit</button>
                        <button type="button" className="danger" onClick={() => removeProduct(product)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {!busy && filteredProducts.length === 0 && <tr><td colSpan={5}>No products found in this category.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
        {activeTab === "Categories" && (
          <>
            {categoriesError && (
              <p className="admin-error" role="alert">
                Categories could not be loaded: {categoriesError}
                {/(PGRST205|schema cache|does not exist)/i.test(categoriesError)
                  ? " Apply supabase/migrations/202611200002_admin_content.sql in Supabase SQL Editor, then reload this dashboard."
                  : " Check the Supabase category table SELECT grant and RLS policies."}
              </p>
            )}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Category</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td><strong>{category.name}</strong><span>{category.description}</span></td>
                      <td>{category.slug}</td>
                      <td><span className={category.published ? "status-live" : "status-draft"}>{category.published ? "Published" : "Hidden"}</span></td>
                      <td><button type="button" onClick={() => setCategoryDraft(category)}>Edit</button><button type="button" className="danger" onClick={() => removeCategory(category)}>Delete</button></td>
                    </tr>
                  ))}
                  {!busy && categories.length === 0 && <tr><td colSpan={4}>No categories found.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
        {activeTab === "Filter Categories" && (
          <>
            {filterCategoriesError && (
              <p className="admin-error" role="alert">
                Filter categories could not be loaded: {filterCategoriesError}
                {/(PGRST205|schema cache|does not exist)/i.test(filterCategoriesError)
                  ? " Apply supabase/migrations/202611200003_filter_categories.sql in Supabase SQL Editor, then reload this dashboard."
                  : " Check the Supabase filter_categories SELECT grant and RLS policies."}
              </p>
            )}
            <p className="admin-field-help">
              Unpublishing hides a filter category from visitors. Existing product assignments are preserved; reassign products before deleting a category.
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Filter category</th><th>Slug</th><th>Display order</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filterCategories.map((category) => {
                    const usageCount = products.filter((product) => product.filterCategoryId === category.id).length;
                    return (
                      <tr key={category.id}>
                        <td><strong>{category.name}</strong><span>{category.description}</span></td>
                        <td>{category.slug}</td>
                        <td>{category.sortOrder}</td>
                        <td>
                          {usageCount}
                          {usageCount > 0 && (
                            <span className="admin-category-usage-warning">
                              In use; reassign products before deleting.
                            </span>
                          )}
                        </td>
                        <td><span className={category.published ? "status-live" : "status-draft"}>{category.published ? "Published" : "Hidden"}</span></td>
                        <td>
                          <button type="button" onClick={() => setFilterCategoryDraft(category)}>Edit</button>
                          <button
                            type="button"
                            className="danger"
                            disabled={usageCount > 0}
                            title={usageCount > 0 ? "Reassign all products before deleting this category." : undefined}
                            onClick={() => void removeFilterCategory(category)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filterCategoriesLoading && (
                    <tr><td colSpan={6}>Loading filter categories…</td></tr>
                  )}
                  {!filterCategoriesLoading && !filterCategoriesError && filterCategories.length === 0 && (
                    <tr><td colSpan={6}>No filter categories yet. Add one to make it available in product forms.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        {activeTab === "Images" && (
          <div className="admin-image-library">
            {products.flatMap((product) =>
              product.images.map((image, index) => (
                <article key={image.id ?? `${product.id}-${index}`}>
                  <ManagedImage
                    storagePath={image.storagePath}
                    fallbackUrl={image.url}
                    alt={image.altText || product.name}
                    loading="lazy"
                  />
                  <strong>{product.name}</strong>
                  <span>{image.storagePath || "Image storage path unavailable"}</span>
                  {!image.isPrimary && image.id && product.databaseId && (
                    <button type="button" onClick={() => void markProductImagePrimary(product, image)}>
                      Set as primary
                    </button>
                  )}
                  {image.isPrimary && <span className="status-live">Primary</span>}
                  {image.id && product.databaseId && (
                    <button
                      type="button"
                      onClick={() => void toggleProductImagePublished(product, image)}
                    >
                      {image.published ? "Unpublish image" : "Publish image"}
                    </button>
                  )}
                  <span className={image.published ? "status-live" : "status-draft"}>
                    {image.published ? "Published" : "Unpublished"}
                  </span>
                  <button type="button" className="danger" onClick={() => {
                    void (async () => {
                      if (!window.confirm("Remove this image?")) return;
                      try {
                        await deleteProductImage(image);
                        await loadProducts();
                      } catch (caught) {
                        setError(`Unable to remove image: ${getErrorMessage(caught, "Unknown Supabase error.")}`);
                      }
                    })();
                  }}>Remove</button>
                </article>
              )),
            )}
            {products.every((product) => product.images.length === 0) && (
              <p className="admin-field-help">No product images have been uploaded yet.</p>
            )}
          </div>
        )}
        {activeTab === "Website Images" && (
          <section className="admin-website-images">
            <p className="admin-field-help">
              Upload a section image, preview it here, then publish it when ready. Website images are stored privately and public visitors can access only published images.
            </p>
            {siteImagesError && (
              <p className="admin-error" role="alert">
                Website images could not be loaded: {siteImagesError}
                {/(PGRST205|schema cache|does not exist)/i.test(siteImagesError)
                  ? " Apply supabase/migrations/202611200004_admin_image_management.sql in Supabase SQL Editor, then reload this dashboard."
                  : ""}
              </p>
            )}
            <form className="admin-settings-form" onSubmit={saveSiteImageDraft}>
              <label>Website section
                <select
                  value={siteImageSection}
                  onChange={(event) => chooseSiteImageSection(event.target.value as SiteImage["sectionKey"])}
                >
                  <option value="about-visual">About Us image</option>
                  <option value="promotional-banner">Promotional banner</option>
                  <option value="site-icon">Website icon</option>
                </select>
              </label>
              <label>Upload or replace image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadSiteImage(file);
                    event.target.value = "";
                  }}
                />
              </label>
              {siteImageDraft.storagePath && (
                <div className="admin-managed-image-preview">
                  <ManagedImage
                    storagePath={siteImageDraft.storagePath}
                    alt={siteImageDraft.altText || "Website image preview"}
                  />
                </div>
              )}
              <label>Alt text<input value={siteImageDraft.altText} onChange={(event) => setSiteImageDraft({ ...siteImageDraft, altText: event.target.value })} /></label>
              <label>Display order<input type="number" min="0" step="1" value={siteImageDraft.sortOrder} onChange={(event) => setSiteImageDraft({ ...siteImageDraft, sortOrder: Number(event.target.value) })} /></label>
              <label className="check"><input type="checkbox" checked={siteImageDraft.published} onChange={(event) => setSiteImageDraft({ ...siteImageDraft, published: event.target.checked })} />Published on website</label>
              <div className="admin-header-actions">
                <button type="submit" className="admin-button" disabled={busy || !siteImageDraft.storagePath}>
                  {busy ? "Saving..." : "Save website image"}
                </button>
                {siteImages.find((image) => image.sectionKey === siteImageSection) && (
                  <button
                    type="button"
                    className="admin-button secondary"
                    onClick={() => {
                      const image = siteImages.find((item) => item.sectionKey === siteImageSection);
                      if (image) void removeSiteImage(image);
                    }}
                    disabled={busy}
                  >
                    Delete section image
                  </button>
                )}
              </div>
            </form>
            <div className="admin-website-image-list">
              {siteImages.map((image) => (
                <article key={image.sectionKey}>
                  <ManagedImage storagePath={image.storagePath} alt={image.altText || image.sectionKey} loading="lazy" />
                  <div>
                    <strong>{image.sectionKey.replace(/-/g, " ")}</strong>
                    <span className={image.published ? "status-live" : "status-draft"}>
                      {image.published ? "Published" : "Unpublished"}
                    </span>
                  </div>
                  <button type="button" onClick={() => chooseSiteImageSection(image.sectionKey)}>Manage</button>
                </article>
              ))}
            </div>
          </section>
        )}
        {activeTab === "Featured Instruments" && (
          <section className="admin-featured-management">
            <form className="admin-featured-limit" onSubmit={saveFeaturedLimit}>
              <label>
                Maximum products on homepage
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={homepage.featuredProductLimit}
                  onChange={(event) => setHomepage({
                    ...homepage,
                    featuredProductLimit: Number(event.target.value),
                  })}
                />
              </label>
              <p>The homepage displays up to this many published, featured products in display order.</p>
              <button type="submit" className="admin-button" disabled={busy}>Save display limit</button>
            </form>
            <div className="admin-featured-list">
              {featuredManagementProducts.map((product) => {
                const pricing = getProductPricing(product);
                const productKey = product.databaseId ?? product.id;
                return (
                  <article className="admin-featured-item" key={productKey}>
                    <div className="admin-featured-controls">
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={product.featured}
                          disabled={busy}
                          onChange={(event) => void saveFeaturedStatus(product, event.target.checked)}
                        />
                        Featured on homepage
                      </label>
                      <label>
                        Display order
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={product.featuredOrder}
                          disabled={!product.featured || busy}
                          onChange={(event) => {
                            const featuredOrder = Number(event.target.value);
                            setProducts((current) => current.map((item) =>
                              (item.databaseId ?? item.id) === productKey
                                ? { ...item, featuredOrder }
                                : item,
                            ));
                          }}
                          onBlur={(event) => {
                            if (product.featured) void saveFeaturedOrder(product, event.target.value);
                          }}
                        />
                      </label>
                      <div className="admin-featured-actions">
                        <span className={product.published ? "status-live" : "status-draft"}>
                          {product.published ? "Published" : "Draft"}
                        </span>
                        <button type="button" onClick={() => openProductDraft(product)}>Manage product & images</button>
                        <button
                          type="button"
                          aria-expanded={featuredPreviewId === productKey}
                          onClick={() => setFeaturedPreviewId((current) => current === productKey ? "" : productKey)}
                        >
                          {featuredPreviewId === productKey ? "Hide preview" : "Preview card"}
                        </button>
                      </div>
                    </div>
                    {featuredPreviewId === productKey && (
                      <article className="product-card product-featured admin-featured-preview">
                        <div className="product-art">
                          <span className="product-category">{product.category}</span>
                          <ManagedImage
                            storagePath={product.imageStoragePath}
                            fallbackUrl={product.imageUrl}
                            alt={product.imageAlt}
                          />
                          <span className="art-index">{product.sku}</span>
                        </div>
                        <div className="product-content">
                          <div className="product-title-row">
                            <h3>{product.name}</h3>
                          </div>
                          <p>{product.description}</p>
                          <div className="product-meta">
                            <div className="product-pricing">
                              {pricing.originalPrice !== undefined && pricing.discountPercentage !== undefined && (
                                <span className="price-details">
                                  <span className="mrp-label">MRP</span>
                                  <s className="original-price">{formatPrice(pricing.originalPrice)}</s>
                                  <span className="discount-badge">{pricing.discountPercentage}% OFF</span>
                                </span>
                              )}
                              {pricing.sellingPrice === undefined
                                ? <span className="price-on-enquiry">Price on enquiry</span>
                                : <strong className="offer-price">{formatPrice(pricing.sellingPrice)}</strong>}
                              <span className="sample-pricing-label">
                                {product.gstRate === undefined ? "GST details on enquiry" : `GST ${product.gstRate}%`}
                              </span>
                            </div>
                            <div className="product-card-actions">
                              <button type="button" className="quote-toggle" disabled>Add to quote</button>
                              <button type="button" className="product-enquire button" disabled>Enquire now</button>
                            </div>
                          </div>
                        </div>
                      </article>
                    )}
                  </article>
                );
              })}
              {featuredManagementProducts.length === 0 && (
                <p>No products are available. Add products in the Products section first.</p>
              )}
            </div>
          </section>
        )}
        {activeTab === "Homepage" && (
          <form className="admin-settings-form" onSubmit={saveHomepage}>
            <label>Hero title<input value={homepage.heroTitle} onChange={(event) => setHomepage({ ...homepage, heroTitle: event.target.value })} /></label>
            <label>Hero subtitle<textarea rows={3} value={homepage.heroSubtitle} onChange={(event) => setHomepage({ ...homepage, heroSubtitle: event.target.value })} /></label>
            <label>Upload or replace hero image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadHomepageImage(file);
              event.target.value = "";
            }} /></label>
            <label>Hero image alt text<input value={homepage.heroImageAlt} onChange={(event) => setHomepage({ ...homepage, heroImageAlt: event.target.value })} /></label>
            <label className="check"><input type="checkbox" checked={homepage.heroImagePublished} onChange={(event) => setHomepage({ ...homepage, heroImagePublished: event.target.checked })} />Publish hero image</label>
            {(homepage.heroImageStoragePath || homepage.heroImageUrl) && (
              <div className="admin-managed-image-preview">
                <ManagedImage
                  storagePath={homepage.heroImageStoragePath}
                  fallbackUrl={homepage.heroImageUrl}
                  alt={homepage.heroImageAlt || "Hero image preview"}
                />
              </div>
            )}
            {(homepage.heroImageStoragePath || homepage.heroImageUrl) && (
              <button type="button" className="admin-button secondary" onClick={() => {
                if (homepageImageDraftPath) {
                  void deleteManagedImage(homepageImageDraftPath).catch((caught: unknown) =>
                    setError(`Unable to clean up the unsaved homepage image: ${getErrorMessage(caught, "Unknown Supabase error.")}`),
                  );
                  setHomepageImageDraftPath("");
                }
                setHomepage({ ...homepage, heroImageStoragePath: "", heroImageUrl: "" });
              }}>
                Remove hero image
              </button>
            )}
            <button type="submit" className="admin-button" disabled={busy}>Save homepage</button>
          </form>
        )}
        {activeTab === "Business" && (
          <form className="admin-settings-form" onSubmit={saveBusiness}>
            <label>Business name<input value={business.name} onChange={(event) => setBusiness({ ...business, name: event.target.value })} /></label>
            <label>GSTIN<input value={business.gstin} onChange={(event) => setBusiness({ ...business, gstin: event.target.value })} /></label>
            <label>Phone<input value={business.phone} onChange={(event) => setBusiness({ ...business, phone: event.target.value })} /></label>
            <label>WhatsApp number or wa.me link<input value={business.whatsapp} onChange={(event) => setBusiness({ ...business, whatsapp: event.target.value })} /></label>
            <label>Email<input type="email" value={business.email} onChange={(event) => setBusiness({ ...business, email: event.target.value })} /></label>
            <label>Address<textarea rows={3} value={business.address} onChange={(event) => setBusiness({ ...business, address: event.target.value })} /></label>
            <label>Instagram<input value={business.instagram} onChange={(event) => setBusiness({ ...business, instagram: event.target.value })} /></label>
            <label>Facebook<input value={business.facebook} onChange={(event) => setBusiness({ ...business, facebook: event.target.value })} /></label>
            <label>LinkedIn<input value={business.linkedin} onChange={(event) => setBusiness({ ...business, linkedin: event.target.value })} /></label>
            <button type="submit" className="admin-button" disabled={busy}>Save business details</button>
          </form>
        )}
      </section>
      {categoryDraft && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={closeCategoryDraft}>
          <form className="admin-form" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} onSubmit={saveCategoryDraft}>
            <header><div><span>{categoryDraft.id ? "Edit category" : "New category"}</span><h2>{categoryDraft.name || "Category"}</h2></div><button type="button" onClick={closeCategoryDraft} aria-label="Close">×</button></header>
            <div className="admin-form-grid">
              <label>Name<input required value={categoryDraft.name} onChange={(event) => {
                const name = event.target.value;
                const generatedSlug = name.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                setCategoryDraft({
                  ...categoryDraft,
                  name,
                  slug: categoryDraft.id ? categoryDraft.slug : generatedSlug,
                });
              }} /></label>
              <label>Slug<input required value={categoryDraft.slug} onChange={(event) => setCategoryDraft({ ...categoryDraft, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></label>
              <label className="full">Description<textarea rows={3} value={categoryDraft.description} onChange={(event) => setCategoryDraft({ ...categoryDraft, description: event.target.value })} /></label>
              <label className="full">Upload or replace category image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadCategoryImage(file);
                event.target.value = "";
              }} /></label>
              {(categoryDraft.imageStoragePath || categoryDraft.image) && (
                <div className="admin-managed-image-preview full">
                  <ManagedImage
                    storagePath={categoryDraft.imageStoragePath}
                    fallbackUrl={categoryDraft.image}
                    alt={`${categoryDraft.name || "Category"} preview`}
                  />
                </div>
              )}
              {(categoryDraft.imageStoragePath || categoryDraft.image) && (
                <label className="full">Category image alt text<input value={categoryDraft.imageAlt} onChange={(event) => setCategoryDraft({ ...categoryDraft, imageAlt: event.target.value })} /></label>
              )}
              {(categoryDraft.imageStoragePath || categoryDraft.image) && (
                <button type="button" className="admin-button secondary" onClick={() => {
                  if (categoryImageDraftPath) {
                    const savedPath = categoryDraft.id
                      ? categories.find((category) => category.id === categoryDraft.id)?.imageStoragePath
                      : undefined;
                    if (categoryImageDraftPath !== savedPath) {
                      void deleteManagedImage(categoryImageDraftPath).catch((caught: unknown) =>
                        setError(`Unable to remove the unsaved category image: ${getErrorMessage(caught, "Unknown Supabase error.")}`),
                      );
                    }
                    setCategoryImageDraftPath("");
                  }
                  setCategoryDraft({ ...categoryDraft, imageStoragePath: undefined, image: "" });
                }}>
                  Remove category image
                </button>
              )}
              <label>Sort order<input type="number" value={categoryDraft.sortOrder} onChange={(event) => setCategoryDraft({ ...categoryDraft, sortOrder: Number(event.target.value) })} /></label>
              {categoryDraft.imageStoragePath && (
                <label className="check">
                  <input type="checkbox" checked={categoryDraft.imagePublished} onChange={(event) => setCategoryDraft({ ...categoryDraft, imagePublished: event.target.checked })} />
                  Publish category image
                </label>
              )}
              <label className="check"><input type="checkbox" checked={categoryDraft.published} onChange={(event) => setCategoryDraft({ ...categoryDraft, published: event.target.checked })} />Published</label>
            </div>
            <footer><button type="button" className="admin-button secondary" onClick={closeCategoryDraft}>Cancel</button><button type="submit" className="admin-button" disabled={busy}>Save category</button></footer>
          </form>
        </div>
      )}
      {filterCategoryDraft && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setFilterCategoryDraft(null)}>
          <form className="admin-form" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} onSubmit={saveFilterCategoryDraft}>
            <header><div><span>{filterCategoryDraft.id ? "Edit filter category" : "New filter category"}</span><h2>{filterCategoryDraft.name || "Filter category"}</h2></div><button type="button" onClick={() => setFilterCategoryDraft(null)} aria-label="Close">×</button></header>
            <div className="admin-form-grid">
              <label>Name<input required value={filterCategoryDraft.name} onChange={(event) => {
                const name = event.target.value;
                const generatedSlug = name.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                setFilterCategoryDraft({
                  ...filterCategoryDraft,
                  name,
                  slug: filterCategoryDraft.id ? filterCategoryDraft.slug : generatedSlug,
                });
              }} /></label>
              <label>Slug<input required value={filterCategoryDraft.slug} onChange={(event) => setFilterCategoryDraft({
                ...filterCategoryDraft,
                slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
              })} /></label>
              <label className="full">Description<textarea rows={3} value={filterCategoryDraft.description} onChange={(event) => setFilterCategoryDraft({ ...filterCategoryDraft, description: event.target.value })} /></label>
              <label>Display order<input type="number" min="0" step="1" value={filterCategoryDraft.sortOrder} onChange={(event) => setFilterCategoryDraft({ ...filterCategoryDraft, sortOrder: Number(event.target.value) })} /></label>
              <label className="check"><input type="checkbox" checked={filterCategoryDraft.published} onChange={(event) => setFilterCategoryDraft({ ...filterCategoryDraft, published: event.target.checked })} />Published</label>
            </div>
            <footer><button type="button" className="admin-button secondary" onClick={() => setFilterCategoryDraft(null)}>Cancel</button><button type="submit" className="admin-button" disabled={busy}>Save filter category</button></footer>
          </form>
        </div>
      )}
      {draft && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={closeProductDraft}>
          <form className="admin-form" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} onSubmit={saveProduct}>
            <header><div><span>{draft.databaseId ? "Edit product" : "New product"}</span><h2>{draft.name || "Untitled instrument"}</h2></div><button type="button" onClick={closeProductDraft} aria-label="Close">×</button></header>
            <div className="admin-form-grid">
              <label>Name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label>SKU<input required value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} /></label>
              <label>Category<select required value={draft.categoryId ?? ""} onChange={(event) => {
                const category = categories.find((item) => item.id === event.target.value);
                setDraft({ ...draft, categoryId: event.target.value || undefined, category: category?.name ?? "" });
              }} disabled={Boolean(categoriesError) || categories.length === 0}>
                <option value="">{categoriesError ? "Categories unavailable" : "Select category"}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
                {categories.length === 0 && (
                  <span className="admin-field-help">
                    {categoriesError
                      ? "Apply the category migration to load categories."
                      : "Create a category in the Categories section before saving this product."}
                    <button type="button" onClick={() => { closeProductDraft(); setActiveTab("Categories"); }}>Manage categories</button>
                  </span>
                )}
              </label>
              <label>Filter category<select
                required
                value={draft.filterCategoryId ?? ""}
                disabled={filterCategoriesLoading || Boolean(filterCategoriesError) || !filterCategories.some((category) => category.published || category.id === draft.filterCategoryId)}
                onChange={(event) => setDraft({ ...draft, filterCategoryId: event.target.value || undefined })}
              >
                <option value="">
                  {filterCategoriesLoading
                    ? "Loading filter categories…"
                    : filterCategoriesError
                      ? "Filter categories unavailable"
                      : "Select filter category"}
                </option>
                {filterCategories
                  .filter((category) => category.published || category.id === draft.filterCategoryId)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}{category.published ? "" : " (unpublished; existing assignment)"}
                    </option>
                  ))}
              </select>
                {!filterCategoriesLoading && !filterCategoriesError && !filterCategories.some((category) => category.published) && !draft.filterCategoryId && (
                  <span className="admin-field-help">
                    Publish a filter category before assigning it to a product.
                    <button type="button" onClick={() => { closeProductDraft(); setActiveTab("Filter Categories"); }}>Manage filter categories</button>
                  </span>
                )}
              </label>
              <label className="full">Description<textarea required rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
              <label>Original price<input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={priceInputs?.original ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setPriceInputs((current) => ({ original: value, offer: current?.offer ?? "" }));
                  }
                }}
              /></label>
              <label>Offer price<input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={priceInputs?.offer ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setPriceInputs((current) => ({ original: current?.original ?? "", offer: value }));
                  }
                }}
              /></label>
              <label>GST rate (%)<input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={draft.gstRate ?? ""}
                onChange={(event) => setDraft({
                  ...draft,
                  gstRate: event.target.value === "" ? undefined : Number(event.target.value),
                })}
              /></label>
              <label>Sort order<input type="number" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} /></label>
              <div className="admin-specifications full">
                <div className="admin-spec-header"><strong>Specifications</strong><button type="button" onClick={() => setDraft({
                  ...draft,
                  specifications: [...draft.specifications, { label: "", value: "", sortOrder: draft.specifications.length }],
                })}>Add specification</button></div>
                {draft.specifications.map((spec, index) => (
                  <div className="admin-spec-row" key={spec.id ?? index}>
                    <input
                      aria-label="Specification name"
                      placeholder="Specification"
                      value={spec.label}
                      onChange={(event) => setDraft({
                        ...draft,
                        specifications: draft.specifications.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, label: event.target.value } : item,
                        ),
                      })}
                    />
                    <input
                      aria-label="Specification value"
                      placeholder="Value"
                      value={spec.value}
                      onChange={(event) => setDraft({
                        ...draft,
                        specifications: draft.specifications.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, value: event.target.value } : item,
                        ),
                      })}
                    />
                    <button type="button" className="danger" aria-label="Remove specification" onClick={() => setDraft({
                      ...draft,
                      specifications: draft.specifications.filter((_, itemIndex) => itemIndex !== index),
                    })}>×</button>
                  </div>
                ))}
              </div>
              <label className="full">Image files<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                void (async () => {
                  for (const file of files) await uploadImage(file);
                })();
              }} /></label>
              {draft.images.length > 0 && (
                <div className="admin-image-preview full">
                  {draft.images.map((image, index) => (
                    <article key={image.id ?? `${image.storagePath}-${index}`}>
                      <ManagedImage
                        storagePath={image.storagePath}
                        fallbackUrl={image.url}
                        alt={image.altText || draft.name}
                      />
                      {!image.isPrimary && image.id && draft.databaseId && (
                        <button type="button" onClick={() => void makePrimaryProductImage(image)}>
                          Set as primary
                        </button>
                      )}
                      {image.isPrimary && <span className="status-live">Primary</span>}
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={Boolean(image.published)}
                          onChange={() => void toggleProductImagePublished(draft, image)}
                        />
                        Published on website
                      </label>
                      <button type="button" className="danger" onClick={() => void removeDraftImage(index)}>Remove</button>
                    </article>
                  ))}
                </div>
              )}
                {draft.imageUrl && !draft.images.some((image) => image.url === draft.imageUrl) && (
                  <div className="admin-managed-image-preview full">
                    <ManagedImage
                      fallbackUrl={draft.imageUrl}
                      alt={draft.imageAlt || `${draft.name || "Product"} legacy image`}
                    />
                    <button
                      type="button"
                      className="admin-button secondary"
                      onClick={() => setDraft({ ...draft, imageUrl: undefined })}
                    >
                      Remove legacy image
                    </button>
                  </div>
                )}
              <label className="full">Image alt text<input value={draft.imageAlt} onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })} /></label>
              <label className="check"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />Featured</label>
              <label className="check"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />Published</label>
            </div>
            <footer><button type="button" className="admin-button secondary" onClick={closeProductDraft}>Cancel</button><button type="submit" className="admin-button" disabled={busy || !draft.categoryId || !draft.filterCategoryId}>{busy ? "Saving..." : "Save product"}</button></footer>
          </form>
        </div>
      )}
    </main>
  );
}
