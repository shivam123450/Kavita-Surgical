import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "./supabase";
import {
  deleteAdminProduct,
  fetchAdminProducts,
  saveAdminProduct,
  type AdminProduct,
} from "./catalogueStore";

const emptyProduct = (): AdminProduct => ({
  id: "",
  databaseId: undefined,
  sku: "",
  name: "",
  category: "Laparoscopic Instruments",
  filterCategory: "Handles & Shafts",
  description: "",
  image: "",
  imageAlt: "",
  originalPrice: undefined,
  offerPrice: undefined,
  featured: false,
  published: false,
  sortOrder: 0,
});

export default function AdminDashboard() {
  const [sessionEmail, setSessionEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<AdminProduct | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadProducts = async () => {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      setProducts(await fetchAdminProducts());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load products.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setError("Supabase environment variables are not configured.");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? "");
      if (data.session) void loadProducts();
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? "");
      if (session) void loadProducts();
      else setProducts([]);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setBusy(false);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const uploadImage = async (file: File) => {
    if (!supabase || !draft) return;
    setBusy(true);
    setError("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      setError(uploadError.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setDraft({ ...draft, image: data.publicUrl });
    setBusy(false);
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      await saveAdminProduct(draft);
      setDraft(null);
      await loadProducts();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save product.");
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (product: AdminProduct) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setBusy(true);
    setError("");
    try {
      await deleteAdminProduct(product);
      await loadProducts();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete product.");
    } finally {
      setBusy(false);
    }
  };

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

  return (
    <main className="admin-shell admin-dashboard">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand"><strong>KAVITA</strong><span>SURGICAL</span></a>
        <nav aria-label="Admin navigation">
          <span className="active">Products</span>
        </nav>
        <button type="button" className="admin-signout" onClick={signOut}>Sign out</button>
      </aside>
      <section className="admin-content">
        <header className="admin-header">
          <div><span>Dashboard</span><h1>Product catalogue</h1></div>
          <button type="button" className="admin-button" onClick={() => setDraft(emptyProduct())}>Add product</button>
        </header>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.databaseId ?? product.id}>
                  <td><strong>{product.name}</strong><span>{product.description}</span></td>
                  <td>{product.sku}</td>
                  <td>{product.category}</td>
                  <td><span className={product.published ? "status-live" : "status-draft"}>{product.published ? "Published" : "Draft"}</span></td>
                  <td>
                    <button type="button" onClick={() => setDraft(product)}>Edit</button>
                    <button type="button" className="danger" onClick={() => removeProduct(product)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!busy && products.length === 0 && <tr><td colSpan={5}>No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setDraft(null)}>
          <form className="admin-form" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} onSubmit={saveProduct}>
            <header><div><span>{draft.databaseId ? "Edit product" : "New product"}</span><h2>{draft.name || "Untitled instrument"}</h2></div><button type="button" onClick={() => setDraft(null)} aria-label="Close">×</button></header>
            <div className="admin-form-grid">
              <label>Name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label>SKU<input required value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} /></label>
              <label>Category<input required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
              <label>Filter category<select value={draft.filterCategory} onChange={(event) => setDraft({ ...draft, filterCategory: event.target.value as AdminProduct["filterCategory"] })}><option>Handles & Shafts</option><option>Dissectors</option><option>Scissors</option><option>Graspers</option></select></label>
              <label className="full">Description<textarea required rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
              <label>Original price<input type="number" min="0" value={draft.originalPrice ?? ""} onChange={(event) => setDraft({ ...draft, originalPrice: event.target.value ? Number(event.target.value) : undefined })} /></label>
              <label>Offer price<input type="number" min="0" value={draft.offerPrice ?? ""} onChange={(event) => setDraft({ ...draft, offerPrice: event.target.value ? Number(event.target.value) : undefined })} /></label>
              <label>Sort order<input type="number" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} /></label>
              <label className="full">Image file<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} /></label>
              <label className="full">Image URL<input value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} /></label>
              <label className="full">Image alt text<input value={draft.imageAlt} onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })} /></label>
              <label className="check"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />Featured</label>
              <label className="check"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />Published</label>
            </div>
            <footer><button type="button" className="admin-button secondary" onClick={() => setDraft(null)}>Cancel</button><button type="submit" className="admin-button" disabled={busy}>{busy ? "Saving..." : "Save product"}</button></footer>
          </form>
        </div>
      )}
    </main>
  );
}
