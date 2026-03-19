import styled from 'styled-components'

const Section = styled.footer`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 4rem 5vw;
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 900px;
  text-align: center;
`

const Panel = styled.div`
  width: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    rgba(22, 22, 26, 0.96) 0%,
    rgba(10, 10, 12, 0.98) 100%
  );
  border: 1px solid rgba(192, 57, 43, 0.25);
  border-radius: 14px;
  padding: 2.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(192, 57, 43, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);

  /* Carbon fiber texture */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.015) 2px,
        rgba(255, 255, 255, 0.015) 4px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.015) 2px,
        rgba(255, 255, 255, 0.015) 4px
      );
    pointer-events: none;
    z-index: 0;
    border-radius: inherit;
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`

const FlagDivider = styled.div`
  width: 60px;
  height: 3px;
  border-radius: 2px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(
    90deg,
    #009246 0%,
    #009246 33%,
    #ffffff 33%,
    #ffffff 66%,
    #ce2b37 66%,
    #ce2b37 100%
  );
`

const Title = styled.h3`
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  color: #ffffff;
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
`

const CreditSection = styled.div`
  margin-bottom: 2rem;
`

const CreditLabel = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 0.5rem;
`

const CreditLink = styled.a`
  display: inline-block;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: #c0392b;
  text-decoration: none;
  transition: color 0.3s ease;
  cursor: pointer;
  position: relative;
  z-index: 10;
  pointer-events: auto;

  &:hover {
    color: #e74c3c;
    text-decoration: underline;
  }
`

const CreditText = styled.p`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-top: 0.5rem;
`

const LicenseNotice = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1.5rem;
`

const LicenseTitle = styled.div`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 0.75rem;
`

const LicenseText = styled.p`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
`

const Copyright = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`

export default function FooterSection({ id }) {
  return (
    <Section id={id}>
      <ContentWrapper>
        <Panel>
          <FlagDivider />
          <Title>Credits & Attribution</Title>

          <CreditSection>
            <CreditLabel>Developed By</CreditLabel>
            <CreditLink href="https://appcrates.pl" target="_blank" rel="noopener noreferrer">
              Arkadiusz Wawrzyniak from appcrates.pl
            </CreditLink>
            <CreditText>
              Portfolio demo project showcasing interactive 3D web experiences
            </CreditText>
          </CreditSection>

          <CreditSection>
            <CreditLabel>3D Model</CreditLabel>
            <CreditLink href="https://sketchfab.com/ddiaz-design" target="_blank" rel="noopener noreferrer">
              ddiaz-design
            </CreditLink>
            <CreditText>
              Original Alfa Romeo Giulia Quadrifoglio 3D model
            </CreditText>
          </CreditSection>

          <LicenseNotice>
            <LicenseTitle>Creative Commons License Notice</LicenseTitle>
            <LicenseText>
              The 3D model used in this project is licensed under Creative Commons.
              Modifications have been made to the original model for this interactive experience.
              Original creator: ddiaz-design on Sketchfab. This project is a non-commercial
              portfolio demonstration.
            </LicenseText>
          </LicenseNotice>

          <Copyright>
            © {new Date().getFullYear()} Alfa Romeo Experience Demo.
            This is a portfolio project and is not affiliated with Alfa Romeo S.p.A.
          </Copyright>
        </Panel>
      </ContentWrapper>
    </Section>
  )
}
