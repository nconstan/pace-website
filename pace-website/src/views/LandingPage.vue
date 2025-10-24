<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Car, Shield, Users, TrendingUp, Star, Phone, Mail } from 'lucide-vue-next'

const router = useRouter()

const navigateToLogin = () => {
  router.push('/login')
}

const features = [
  {
    icon: Shield,
    title: 'Comprehensive Coverage',
    description: 'Full protection for your vehicle with customizable plans that fit your needs and budget.'
  },
  {
    icon: Users,
    title: 'Expert Support',
    description: '24/7 customer service with experienced agents ready to help you every step of the way.'
  },
  {
    icon: TrendingUp,
    title: 'Competitive Rates',
    description: 'Best-in-class pricing with discounts for safe drivers and loyal customers.'
  },
  {
    icon: Car,
    title: 'Quick Claims',
    description: 'Fast and easy claims processing with our streamlined digital platform.'
  }
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    rating: 5,
    text: 'Excellent service and great rates. The claims process was incredibly smooth when I needed it.'
  },
  {
    name: 'Mike Chen',
    rating: 5,
    text: 'Professional team and comprehensive coverage. Highly recommend for anyone looking for reliable car insurance.'
  },
  {
    name: 'Lisa Williams',
    rating: 5,
    text: 'Saved money and got better coverage. The online portal makes managing my policy so easy.'
  }
]
</script>

<template>
  <div class="landing-page">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="nav-brand">
          <div class="logo">
            <Shield class="logo-icon" />
            <span class="logo-text">AutoGuard Insurance</span>
          </div>
        </div>
        <nav class="nav-menu">
          <a href="#features" class="nav-link">Features</a>
          <a href="#about" class="nav-link">About</a>
          <a href="#contact" class="nav-link">Contact</a>
          <button @click="navigateToLogin" class="btn btn-primary">Agent Login</button>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Protect Your Journey with
              <span class="highlight">Premium Car Insurance</span>
            </h1>
            <p class="hero-description">
              Get comprehensive coverage, competitive rates, and exceptional service. 
              Join thousands of satisfied customers who trust us to protect their vehicles.
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-large">Get Free Quote</button>
              <button class="btn btn-secondary btn-large">Learn More</button>
            </div>
            <div class="hero-stats">
              <div class="stat">
                <div class="stat-number">50K+</div>
                <div class="stat-label">Happy Customers</div>
              </div>
              <div class="stat">
                <div class="stat-number">99%</div>
                <div class="stat-label">Claims Satisfaction</div>
              </div>
              <div class="stat">
                <div class="stat-number">24/7</div>
                <div class="stat-label">Support Available</div>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-image">
              <img src="https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Car Insurance Protection" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Why Choose AutoGuard Insurance?</h2>
          <p class="section-description">
            We provide comprehensive protection with unmatched service and competitive pricing
          </p>
        </div>
        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon">
              <component :is="feature.icon" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">What Our Customers Say</h2>
        </div>
        <div class="testimonials-grid">
          <div v-for="testimonial in testimonials" :key="testimonial.name" class="testimonial-card">
            <div class="testimonial-rating">
              <Star v-for="n in testimonial.rating" :key="n" class="star filled" />
            </div>
            <p class="testimonial-text">"{{ testimonial.text }}"</p>
            <div class="testimonial-author">{{ testimonial.name }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Get Protected?</h2>
          <p class="cta-description">
            Join thousands of satisfied customers and get your free quote today
          </p>
          <button class="btn btn-primary btn-large">Get Your Free Quote</button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer id="contact" class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <div class="logo">
              <Shield class="logo-icon" />
              <span class="logo-text">AutoGuard Insurance</span>
            </div>
            <p class="footer-description">
              Protecting your journey with comprehensive car insurance coverage and exceptional service.
            </p>
          </div>
          <div class="footer-section">
            <h4 class="footer-title">Contact Info</h4>
            <div class="contact-item">
              <Phone class="contact-icon" />
              <span>1-800-AUTOGUARD</span>
            </div>
            <div class="contact-item">
              <Mail class="contact-icon" />
              <span>info@autoguard.com</span>
            </div>
          </div>
          <div class="footer-section">
            <h4 class="footer-title">Quick Links</h4>
            <a href="#features" class="footer-link">Features</a>
            <a href="#about" class="footer-link">About Us</a>
            <button @click="navigateToLogin" class="footer-link">Agent Portal</button>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 AutoGuard Insurance. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: #fff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  color: #ffa242;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2A525A;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #2A525A;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: #ffa242;
  color: #2A525A;
}

.btn-primary:hover {
  background: #e6d700;
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: #2A525A;
  border: 2px solid #2A525A;
}

.btn-secondary:hover {
  background: #2A525A;
  color: white;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

/* Hero Section */
.hero {
  padding: 8rem 0 4rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-title {
  font-size: 3.5rem;
  line-height: 1.2;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.highlight {
  color: #2A525A;
}

.hero-description {
  font-size: 1.2rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}

.hero-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2A525A;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.hero-image {
  width: 100%;
  max-width: 500px;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.hero-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

/* Features Section */
.features {
  padding: 6rem 0;
  background: white;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.section-description {
  font-size: 1.2rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-icon {
  width: 4rem;
  height: 4rem;
  background: #ffa242;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.feature-icon svg {
  width: 2rem;
  height: 2rem;
  color: #2A525A;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.feature-description {
  color: #6b7280;
  line-height: 1.6;
}

/* Testimonials Section */
.testimonials {
  padding: 6rem 0;
  background: #f8fafc;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.testimonial-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.testimonial-rating {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.star {
  width: 1.25rem;
  height: 1.25rem;
  color: #ffa242;
  fill: currentColor;
}

.testimonial-text {
  font-size: 1.1rem;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.testimonial-author {
  font-weight: 600;
  color: #2A525A;
}

/* CTA Section */
.cta {
  padding: 6rem 0;
  background: #2A525A;
  color: white;
}

.cta-content {
  text-align: center;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cta-description {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* Footer */
.footer {
  background: #1f2937;
  color: white;
  padding: 3rem 0 1rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-description {
  color: #d1d5db;
  line-height: 1.6;
  margin-top: 1rem;
}

.footer-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.contact-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.footer-link {
  display: block;
  color: #d1d5db;
  text-decoration: none;
  margin-bottom: 0.5rem;
  transition: color 0.2s;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.footer-link:hover {
  color: #ffa242;
}

.footer-bottom {
  border-top: 1px solid #374151;
  padding-top: 2rem;
  text-align: center;
  color: #9ca3af;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-stats {
    justify-content: center;
  }
  
  .nav-menu {
    display: none;
  }
}
</style>