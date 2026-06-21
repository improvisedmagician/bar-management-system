import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qwoyxomwaujlcdxxvouf.supabase.co';
const supabaseKey = 'sb_publishable_JyLDOOOYSq6i9PLiumC2eg_TM0KhMaB';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Criando categorias...');
  const { data: catBar, error: err1 } = await supabase.from('categories').insert([
    { name: 'Cervejas', type: 'Bar' },
    { name: 'Drinks', type: 'Bar' },
    { name: 'Sucos e Refris', type: 'Bar' }
  ]).select();

  const { data: catCoz, error: err2 } = await supabase.from('categories').insert([
    { name: 'Porções', type: 'Cozinha' },
    { name: 'Lanches', type: 'Cozinha' },
    { name: 'Sobremesas', type: 'Cozinha' }
  ]).select();

  if (err1 || err2) {
    console.error('Erro ao criar categorias:', err1, err2);
    return;
  }

  const allCategories = [...(catBar || []), ...(catCoz || [])];
  
  const getCatId = (name) => allCategories.find(c => c.name === name)?.id;

  console.log('Criando produtos...');
  const products = [
    { name: 'Heineken 600ml', price: 18.90, stock_quantity: 50, category_id: getCatId('Cervejas') },
    { name: 'Original 600ml', price: 16.90, stock_quantity: 100, category_id: getCatId('Cervejas') },
    { name: 'Caipirinha de Limão', price: 22.00, stock_quantity: -1, category_id: getCatId('Drinks') },
    { name: 'Gin Tônica', price: 28.50, stock_quantity: -1, category_id: getCatId('Drinks') },
    { name: 'Coca-Cola Lata', price: 7.00, stock_quantity: 120, category_id: getCatId('Sucos e Refris') },
    { name: 'Suco de Laranja', price: 10.00, stock_quantity: -1, category_id: getCatId('Sucos e Refris') },
    
    { name: 'Batata Frita com Cheddar', price: 35.00, stock_quantity: -1, category_id: getCatId('Porções') },
    { name: 'Isca de Frango', price: 42.00, stock_quantity: -1, category_id: getCatId('Porções') },
    { name: 'Hamburguer Artesanal', price: 38.90, stock_quantity: 30, category_id: getCatId('Lanches') },
    { name: 'X-Salada', price: 25.00, stock_quantity: 40, category_id: getCatId('Lanches') },
    { name: 'Pudim', price: 12.00, stock_quantity: 15, category_id: getCatId('Sobremesas') }
  ];

  const { error: err3 } = await supabase.from('products').insert(products);

  if (err3) {
    console.error('Erro ao criar produtos:', err3);
  } else {
    console.log('Produtos e categorias adicionados com sucesso!');
  }
}

seed();
