export default function PlaygroundPage() {
  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <header>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>Playground</h1>
          <p className='text-gray-600'>
            Experiment with components, styles, and functionality without
            authentication.
          </p>
        </header>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <section className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-xl font-semibold mb-4'>Component Showcase</h2>
            <div className='space-y-3'>
              <button className='w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
                Primary Button
              </button>
              <button className='w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50'>
                Secondary Button
              </button>
              <div className='p-3 bg-yellow-100 border border-yellow-300 rounded'>
                <p className='text-sm'>⚠️ Warning message</p>
              </div>
              <div className='p-3 bg-green-100 border border-green-300 rounded'>
                <p className='text-sm'>✅ Success message</p>
              </div>
            </div>
          </section>

          <section className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-xl font-semibold mb-4'>Development Info</h2>
            <div className='space-y-2 text-sm'>
              <div>
                <span className='font-medium'>Environment:</span>{' '}
                {process.env.NODE_ENV}
              </div>
              <div>
                <span className='font-medium'>Time:</span>{' '}
                {new Date().toLocaleString()}
              </div>
            </div>
          </section>

          <section className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-xl font-semibold mb-4'>Quick Links</h2>
            <div className='space-y-2'>
              <a href='/' className='block text-blue-600 hover:underline'>
                → Home
              </a>
              <a
                href='/dashboard'
                className='block text-blue-600 hover:underline'
              >
                → Dashboard (requires auth)
              </a>
              <a
                href='/api/debug/clear-cache'
                className='block text-blue-600 hover:underline'
              >
                → Clear Cache API
              </a>
            </div>
          </section>

          <section className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-xl font-semibold mb-4'>Experiment Area</h2>
            <div className='bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500'>
              <p>Add your experimental components and code here</p>
              <p className='text-sm mt-2'>
                This area is perfect for testing new ideas
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
