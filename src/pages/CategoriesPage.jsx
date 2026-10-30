import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categoryTable, supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../store/useToastStore';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const storeKey = useAppStore((state) => state.currentStoreKey);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  useEffect(() => {
    if (!storeKey) {
      navigate('/', { replace: true });
      return;
    }

    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey, navigate]);

  const loadCategories = async () => {
    if (!storeKey) {
      return;
    }

    setLoading(true);

    const { data } = await supabase
      .from(categoryTable(storeKey))
      .select('*')
      .order('display_order', { ascending: true });

    setCategories(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
    setName('');
    setDisplayOrder(categories.length);
  };

  const openEdit = (category) => {
    setEditing(category);
    setModalOpen(true);
    setName(category.category_name);
    setDisplayOrder(category.display_order);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!storeKey) {
      return;
    }

    if (!name.trim()) {
      toast.error('카테고리명을 입력하세요.');
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from(categoryTable(storeKey))
        .update({
          category_name: name.trim(),
          display_order: displayOrder,
        })
        .eq('id', editing.id);

      if (error) {
        toast.error(`수정 실패: ${error.message}`);
        return;
      }

      toast.success('카테고리가 수정되었습니다');
    } else {
      const { error } = await supabase
        .from(categoryTable(storeKey))
        .insert({
          store_key: storeKey,
          category_name: name.trim(),
          display_order: displayOrder,
          is_active: true,
        });

      if (error) {
        toast.error(`추가 실패: ${error.message}`);
        return;
      }

      toast.success('카테고리가 추가되었습니다');
    }

    closeModal();
    loadCategories();
  };

  const handleDelete = async (category) => {
    if (
      !storeKey ||
      !confirm(`'${category.category_name}' 카테고리를 삭제하시겠습니까?`)
    ) {
      return;
    }

    const { error } = await supabase
      .from(categoryTable(storeKey))
      .update({ is_active: false })
      .eq('id', category.id);

    if (error) {
      toast.error(`삭제 실패: ${error.message}`);
      return;
    }

    toast.success('카테고리가 삭제되었습니다');
    loadCategories();
  };

  if (!storeKey) {
    return null;
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link
          to="/main"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          aria-label="뒤로"
        >
          ←
        </Link>
        <h1 className="font-semibold text-gray-900">카테고리 관리</h1>
      </header>

      <main className="flex-1 px-4 py-4">
        {loading ? (
          <div className="text-center text-gray-400 py-10">
            불러오는 중...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🏷️</div>
            <p>카테고리가 없습니다.</p>
            <p className="text-sm mt-1">+ 버튼으로 추가하세요.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {categories
              .filter((category) => category.is_active)
              .map((category) => (
                <li
                  className="card flex items-center justify-between"
                  key={category.id}
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {category.category_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      순서: {category.display_order}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(category)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      편집
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </main>

      <button
        onClick={openAdd}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-brand-600 text-white text-3xl shadow-lg flex items-center justify-center active:scale-95 hover:bg-brand-700"
        aria-label="카테고리 추가"
      >
        +
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5 space-y-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-semibold text-lg">
              {editing ? '카테고리 편집' : '새 카테고리'}
            </h2>

            <div>
              <label className="label">이름</label>
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="label">표시 순서</label>
              <input
                type="number"
                className="input"
                value={displayOrder}
                onChange={(event) => setDisplayOrder(Number(event.target.value))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={closeModal} className="btn-secondary flex-1">
                취소
              </button>
              <button onClick={handleSave} className="btn-primary flex-1">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
