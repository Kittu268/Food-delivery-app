import React from "react";
import styled from "styled-components";
import TextInput from "../components/TextInput";
import Button from "../components/Button";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 200px;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
  background: ${({ theme }) => theme.bg};
`;
const Section = styled.div`
  width: 100%;
  max-width: 800px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
`;
const Title = styled.div`
  font-size: 28px;
  font-weight: 500;
  text-align: center;
  color: ${({ theme }) => theme.text_primary};
`;

const Description = styled.p`
  font-size: 16px;
  text-align: center;
  color: ${({ theme }) => theme.text_secondary};
  line-height: 1.6;
`;

const ContactForm = styled.form`
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
`;

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    console.log("Form data submitted:", formData);
    setTimeout(() => {
      setLoading(false);
      alert("Thank you for your message! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    }, 1500);
  };

  return (
    <Container>
      <Section>
        <Title>Contact Us</Title>
        <Description>
          Have questions or feedback? We'd love to hear from you! Fill out the
          form below, and our team will get back to you as soon as possible.
        </Description>
        <ContactForm onSubmit={handleSubmit}>
          <TextInput
            label="Your Name"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            handelChange={handleChange}
          />
          <TextInput
            label="Email Address"
            name="email"
            placeholder="Enter your email address"
            value={formData.email}
            handelChange={handleChange}
          />
          <TextInput
            label="Message"
            name="message"
            placeholder="Write your message here..."
            textArea
            rows="6"
            value={formData.message}
            handelChange={handleChange}
          />
          <Button
            text="Send Message"
            type="submit"
            isLoading={loading}
            isDisabled={loading}
            full
          />
        </ContactForm>
      </Section>
    </Container>
  );
};

export default Contact;