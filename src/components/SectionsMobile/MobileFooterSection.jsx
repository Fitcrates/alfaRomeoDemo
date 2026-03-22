import styled from 'styled-components'

const Section = styled.footer`
  padding: 3rem 16px 2rem;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
  text-align: center;
`

const FlagDivider = styled.div`
  width: 40px;
  height: 2px;
  border-radius: 1px;
  margin: 0 auto 1.25rem;
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
  font-size: 1rem;
  color: #ffffff;
  margin-bottom: 1.25rem;
  letter-spacing: 0.1em;
`

const CreditSection = styled.div`
  margin-bottom: 1.5rem;
`

const CreditLabel = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 0.25rem;
`

const CreditLink = styled.a`
  display: inline-block;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  color: #c0392b;
  text-decoration: none;
  
  &:active {
    color: #e74c3c;
  }
`

const CreditText = styled.p`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
  margin-bottom: 0;
`

const Copyright = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  line-height: 1.4;
`

export default function MobileFooterSection({ id }) {
  return (
    <Section id={id}>
        <Panel>
          <FlagDivider />
          <Title>Credits</Title>

          <CreditSection>
            <CreditLabel>Developed By</CreditLabel>
            <CreditLink href="https://appcrates.pl" target="_blank" rel="noopener noreferrer">
              Arkadiusz Wawrzyniak
            </CreditLink>
            <CreditText>
              Portfolio demo project
            </CreditText>
          </CreditSection>

          <CreditSection>
            <CreditLabel>3D Model</CreditLabel>
            <CreditLink href="https://sketchfab.com/ddiaz-design" target="_blank" rel="noopener noreferrer">
              ddiaz-design
            </CreditLink>
          </CreditSection>

          <Copyright>
            © {new Date().getFullYear()} Alfa Romeo Experience Demo.<br/>
            Not affiliated with Alfa Romeo S.p.A.
          </Copyright>
        </Panel>
    </Section>
  )
}
