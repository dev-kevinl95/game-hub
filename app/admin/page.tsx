"use client";

import { useCallback, useEffect, useState } from "react";

type Category = { id: number; name: string };

type Game = {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail_url: string | null;
  banner_url: string | null;
  game_url: string;
  plays: number;
  rating: number;
  featured: number;
  created_at: string;
};

type EditingGame = {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string;
  featured: boolean;
};

type Post = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  game_id: number | null;
  created_at: string;
};

type EditingPost = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  gameId: string;
};

const TOKEN_KEY = "gamePortalToken";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  });
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editZipFile, setEditZipFile] = useState<File | null>(null);
  const [zipUploading, setZipUploading] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const [editing, setEditing] = useState<EditingGame | null>(null);
  const [showDelete, setShowDelete] = useState<Game | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postSlug, setPostSlug] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postExcerpt, setPostExcerpt] = useState("");
  const [postGameId, setPostGameId] = useState("");
  const [editingPost, setEditingPost] = useState<EditingPost | null>(null);
  const [showDeletePost, setShowDeletePost] = useState<Post | null>(null);

  const loadGames = useCallback(async () => {
    const res = await fetch("/api/games");
    if (res.ok) setGames(await res.json());
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  const loadPosts = useCallback(async (authToken: string) => {
    const res = await fetch("/api/admin/posts", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(
        (data.posts ?? []).map((p: Post) => ({
          ...p,
          game_id: p.game_id ?? null,
        }))
      );
    }
  }, []);

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadGames();
      loadCategories();
      loadPosts(token);
    }
  }, [token, loadGames, loadCategories, loadPosts]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginError("Contraseña incorrecta");
      return;
    }
    const { token: newToken } = await res.json();
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setPassword("");
    loadGames();
    loadCategories();
    loadPosts(newToken);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setGames([]);
    setCategories([]);
    setPosts([]);
  }

  function xhrUpload(
    method: string,
    url: string,
    form: FormData,
    authToken: string | null,
    onProgress: (pct: number) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      if (authToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
      }
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        resolve(
          new Response(xhr.responseText, {
            status: xhr.status,
            headers: { "Content-Type": "application/json" },
          })
        );
      };
      xhr.onerror = () => reject(new Error("Error de red"));
      xhr.send(form);
    });
  }

  async function uploadZipToStorage(
    file: File,
    authToken: string
  ): Promise<string> {
    const initRes = await fetch("/api/admin/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!initRes.ok) {
      const data = await initRes.json().catch(() => ({}));
      throw new Error(data.error ?? "Error al preparar la subida");
    }
    const { zipPath, uploadUrl } = await initRes.json();
    if (!zipPath || !uploadUrl) {
      throw new Error("Respuesta de subida inválida");
    }

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", "application/zip");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setZipProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error("Fallo al subir el zip al almacenamiento"));
        }
      };
      xhr.onerror = () => reject(new Error("Error de red al subir el zip"));
      xhr.send(file);
    });

    return zipPath;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    setError(null);
    const hasZip = !!zipFile;

    try {
      let zipPath = "";
      if (hasZip && token) {
        setZipUploading(true);
        setZipProgress(0);
        zipPath = await uploadZipToStorage(zipFile, token);
      }

      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      form.append("category", category);
      form.append("tags", tags);
      form.append("featured", featured ? "on" : "off");
      form.append("zipPath", zipPath);
      if (thumbnail) form.append("thumbnail", thumbnail);
      if (banner) form.append("banner", banner);

      const res = await xhrUpload(
        "POST",
        "/api/admin/games",
        form,
        token,
        () => {}
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al subir el juego");
        return;
      }
      setStatus("Juego subido correctamente");
      setTitle("");
      setDescription("");
      setCategory("");
      setTags("");
      setFeatured(false);
      setZipFile(null);
      setThumbnail(null);
      setBanner(null);
      loadGames();
    } catch (err) {
      setError((err as Error).message || "Error de red al subir el juego");
    } finally {
      setBusy(false);
      if (hasZip) setZipUploading(false);
    }
  }

  function startEdit(game: Game) {
    setEditing({
      id: game.id,
      title: game.title,
      description: game.description,
      category: game.category,
      tags: game.tags.join(", "),
      featured: game.featured === 1,
    });
    setEditZipFile(null);
    setZipProgress(0);
    setStatus(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setStatus(null);
    setError(null);
    const hasZip = !!editZipFile;

    try {
      let zipPath = "";
      if (hasZip && token) {
        setZipUploading(true);
        setZipProgress(0);
        zipPath = await uploadZipToStorage(editZipFile, token);
      }

      const form = new FormData();
      form.append("title", editing.title);
      form.append("description", editing.description);
      form.append("category", editing.category);
      form.append("tags", editing.tags);
      form.append("featured", editing.featured ? "on" : "off");
      form.append("zipPath", zipPath);
      if (thumbnail) form.append("thumbnail", thumbnail);
      if (banner) form.append("banner", banner);

      const res = await xhrUpload(
        "PUT",
        `/api/admin/games/${editing.id}`,
        form,
        token,
        () => {}
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al editar el juego");
        return;
      }
      setStatus("Cambios guardados");
      setEditing(null);
      setEditZipFile(null);
      setThumbnail(null);
      setBanner(null);
      loadGames();
    } catch (err) {
      setError((err as Error).message || "Error de red al editar el juego");
    } finally {
      setBusy(false);
      if (hasZip) setZipUploading(false);
    }
  }

  async function confirmDelete() {
    if (!showDelete) return;
    const res = await fetch(`/api/admin/games/${showDelete.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setShowDelete(null);
      setStatus("Juego eliminado");
      loadGames();
    }
  }

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setNewCategory("");
      loadCategories();
    }
  }

  function resetPostForm() {
    setPostSlug("");
    setPostTitle("");
    setPostContent("");
    setPostExcerpt("");
    setPostGameId("");
    setEditingPost(null);
  }

  function parseGameId(value: string): number | null {
    if (value === "" || value === "0") return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    setError(null);

    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        slug: postSlug.trim(),
        title: postTitle.trim(),
        content: postContent,
        excerpt: postExcerpt.trim(),
        game_id: parseGameId(postGameId),
      }),
    });

    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al crear el post");
      return;
    }
    setStatus("Artículo creado correctamente");
    resetPostForm();
    loadPosts(token!);
  }

  function startEditPost(post: Post) {
    setEditingPost({
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      gameId: post.game_id != null ? String(post.game_id) : "",
    });
    setStatus(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEditPost(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPost) return;
    setBusy(true);
    setStatus(null);
    setError(null);

    const res = await fetch(`/api/admin/posts/${editingPost.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        slug: editingPost.slug.trim(),
        title: editingPost.title.trim(),
        content: editingPost.content,
        excerpt: editingPost.excerpt.trim(),
        game_id: parseGameId(editingPost.gameId),
      }),
    });

    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al editar el post");
      return;
    }
    setStatus("Cambios guardados");
    resetPostForm();
    loadPosts(token!);
  }

  async function confirmDeletePost() {
    if (!showDeletePost) return;
    const res = await fetch(`/api/admin/posts/${showDeletePost.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setShowDeletePost(null);
      setStatus("Artículo eliminado");
      loadPosts(token!);
    }
  }

  if (!token) {
    return (
      <div className="container login-wrap">
        <h1 className="login-title">Panel de administración</h1>
        <form onSubmit={handleLogin} className="form-card login-card">
          <div className="form-field">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-input"
              autoFocus
            />
          </div>
          {loginError && <p className="alert alert-error">{loginError}</p>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary login-btn">
              Entrar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1 className="admin-title">Panel de administración</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Cerrar sesión
        </button>
      </div>

      {status && <p className="alert alert-success">{status}</p>}
      {error && <p className="alert alert-error">{error}</p>}

      <form
        onSubmit={editing ? handleEdit : handleCreate}
        className="form-card"
      >
        <h2 className="form-title">
          {editing ? `Editando: ${editing.title}` : "Subir nuevo juego"}
        </h2>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label">Título *</label>
            <input
              value={editing ? editing.title : title}
              onChange={(e) =>
                editing
                  ? setEditing({ ...editing, title: e.target.value })
                  : setTitle(e.target.value)
              }
              className="text-input"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Categoría</label>
            <select
              value={editing ? editing.category : category}
              onChange={(e) =>
                editing
                  ? setEditing({ ...editing, category: e.target.value })
                  : setCategory(e.target.value)
              }
              className="select"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Descripción</label>
          <textarea
            value={editing ? editing.description : description}
            onChange={(e) =>
              editing
                ? setEditing({ ...editing, description: e.target.value })
                : setDescription(e.target.value)
            }
            className="textarea"
          />
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label">
              Etiquetas (separadas por coma)
            </label>
            <input
              value={editing ? editing.tags : tags}
              onChange={(e) =>
                editing
                  ? setEditing({ ...editing, tags: e.target.value })
                  : setTags(e.target.value)
              }
              placeholder="multiplayer, 2d, puzzle"
              className="text-input"
            />
          </div>
          <div className="form-field checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editing ? editing.featured : featured}
                onChange={(e) =>
                  editing
                    ? setEditing({ ...editing, featured: e.target.checked })
                    : setFeatured(e.target.checked)
                }
              />
              Destacado
            </label>
          </div>
        </div>

        <div className="form-grid-3">
          <div className="form-field">
            <label className="form-label">
              {editing ? "Juego (.zip): reemplazar versión" : "Juego (.zip) *"}
            </label>
            {editing ? (
              <>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    setEditZipFile(e.target.files?.[0] ?? null);
                    setZipProgress(0);
                  }}
                  className="file-input"
                  disabled={zipUploading}
                />
                <span className="form-hint">
                  Si subes un .zip, reemplazará la versión actual.
                </span>
              </>
            ) : (
              <>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
                  className="file-input"
                  required
                />
              </>
            )}
            {zipUploading && (
              <span className="zip-upload-status">
                <span className="spinner" aria-hidden="true" />
                Subiendo zip... {zipProgress}%
              </span>
            )}
          </div>
          <div className="form-field">
            <label className="form-label">Miniatura</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
              className="file-input"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Banner</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBanner(e.target.files?.[0] ?? null)}
              className="file-input"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary"
          >
            {busy ? "Guardando..." : editing ? "Guardar cambios" : "Subir juego"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setEditZipFile(null);
                setZipProgress(0);
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="section-card">
        <h2 className="section-title">Categorías</h2>
        <div className="tags">
          {categories.map((c) => (
            <span key={c.id} className="tag">
              {c.name}
            </span>
          ))}
        </div>
        <div className="category-add">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nueva categoría"
            className="text-input category-input"
          />
          <button type="button" onClick={addCategory} className="btn btn-ghost">
            Agregar
          </button>
        </div>
      </div>

      <div className="section-card">
        <h2 className="section-title">Juegos ({games.length})</h2>
        {games.length === 0 ? (
          <p className="empty">No hay juegos.</p>
        ) : (
          <ul className="game-list">
            {games.map((game) => (
              <li key={game.id} className="game-item">
                <div className="game-item-info">
                  <p className="game-item-title">
                    {game.title}
                    {game.featured === 1 && (
                      <span className="badge-featured">destacado</span>
                    )}
                  </p>
                  <p className="game-item-meta">
                    {game.category} · {game.plays.toLocaleString()} partidas
                  </p>
                </div>
                <div className="game-item-actions">
                  <button
                    onClick={() => startEdit(game)}
                    className="btn btn-ghost"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setShowDelete(game)}
                    className="btn btn-ghost btn-ghost-danger"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="section-card">
        <h2 className="section-title">
          {editingPost ? `Editando post: ${editingPost.title}` : "Nuevo artículo de blog"}
        </h2>
        <form
          onSubmit={editingPost ? handleEditPost : handleCreatePost}
          className="post-form"
        >
          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-label">Título *</label>
              <input
                value={editingPost ? editingPost.title : postTitle}
                onChange={(e) =>
                  editingPost
                    ? setEditingPost({ ...editingPost, title: e.target.value })
                    : setPostTitle(e.target.value)
                }
                className="text-input"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Slug *</label>
              <input
                value={editingPost ? editingPost.slug : postSlug}
                onChange={(e) =>
                  editingPost
                    ? setEditingPost({ ...editingPost, slug: e.target.value })
                    : setPostSlug(e.target.value)
                }
                placeholder="mi-juego-2d"
                className="text-input"
                required
              />
              <span className="form-hint">
                Solo minúsculas, números y guiones. Se usa en /blog/&lt;slug&gt;
              </span>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-label">Extracto</label>
              <input
                value={editingPost ? editingPost.excerpt : postExcerpt}
                onChange={(e) =>
                  editingPost
                    ? setEditingPost({ ...editingPost, excerpt: e.target.value })
                    : setPostExcerpt(e.target.value)
                }
                className="text-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Juego asociado</label>
              <select
                value={editingPost ? editingPost.gameId : postGameId}
                onChange={(e) =>
                  editingPost
                    ? setEditingPost({ ...editingPost, gameId: e.target.value })
                    : setPostGameId(e.target.value)
                }
                className="select"
              >
                <option value="">Sin juego (post independiente)</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Contenido (Markdown) *</label>
            <textarea
              value={editingPost ? editingPost.content : postContent}
              onChange={(e) =>
                editingPost
                  ? setEditingPost({ ...editingPost, content: e.target.value })
                  : setPostContent(e.target.value)
              }
              className="textarea textarea-lg"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Guardando..." : editingPost ? "Guardar cambios" : "Publicar artículo"}
            </button>
            {editingPost && (
              <button
                type="button"
                onClick={resetPostForm}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="section-card">
        <h2 className="section-title">Blog ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="empty">No hay artículos.</p>
        ) : (
          <ul className="game-list">
            {posts.map((post) => (
              <li key={post.id} className="game-item">
                <div className="game-item-info">
                  <p className="game-item-title">{post.title}</p>
                  <p className="game-item-meta">
                    /blog/{post.slug} ·{" "}
                    {post.game_id
                      ? games.find((g) => g.id === post.game_id)?.title ?? "juego"
                      : "independiente"}
                  </p>
                </div>
                <div className="game-item-actions">
                  <button
                    onClick={() => startEditPost(post)}
                    className="btn btn-ghost"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setShowDeletePost(post)}
                    className="btn btn-ghost btn-ghost-danger"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">
              ¿Borrar &quot;{showDelete.title}&quot;?
            </h3>
            <p className="modal-text">
              Se eliminará el juego, sus archivos y sus imágenes. Esta acción no
              se puede deshacer.
            </p>
            <div className="modal-actions">
              <button
                onClick={confirmDelete}
                className="btn btn-danger"
              >
                Borrar
              </button>
              <button
                onClick={() => setShowDelete(null)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeletePost && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">
              ¿Borrar &quot;{showDeletePost.title}&quot;?
            </h3>
            <p className="modal-text">
              Se eliminará el artículo del blog. Esta acción no se puede
              deshacer.
            </p>
            <div className="modal-actions">
              <button
                onClick={confirmDeletePost}
                className="btn btn-danger"
              >
                Borrar
              </button>
              <button
                onClick={() => setShowDeletePost(null)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}