import { getHeroImage } from '../utils/images';

const PageHero = ({ label, title, subtitle, children, image }) => (
    <section className="relative overflow-hidden border-b border-theme-nav">
        <div className="absolute inset-0">
            <img src={image || getHeroImage()} alt="" className="w-full h-full object-cover opacity-25" />
            <div className="absolute inset-0 page-hero-overlay" />
            <div className="absolute inset-0 bg-grid opacity-40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20 animate-fade-up">
            {label && (
                <p className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-400 mb-3">
                    {label}
                </p>
            )}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-theme leading-tight">
                {title}
            </h1>
            {subtitle && (
                <p className="mt-4 text-lg text-theme-muted max-w-2xl">{subtitle}</p>
            )}
            {children && <div className="mt-8">{children}</div>}
        </div>
    </section>
);

export default PageHero;
