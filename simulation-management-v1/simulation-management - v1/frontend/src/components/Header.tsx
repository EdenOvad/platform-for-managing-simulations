/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import userImg from '../assets/images/user.png';
import logo1Img from '../assets/images/logo-1.png';
import { getToken } from '../utils/Utils';
import { RootState, useAppSelector } from '../redux/store';

const Header = () => {
  const user = useAppSelector((state: RootState) => state.userState.user);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const accessToken = getToken();
  const navigate = useNavigate();
  const toggle = () => setIsOpen(!isOpen);
  const location = useLocation();

  const currentRoute = location.pathname;

  const onLogoutHandler = () => {
  };

  return (
    <header>
      <div className="container">
        <Navbar expand="md">
          <NavbarBrand
            href={
              accessToken ? '/' : '/'
            }>
            <img
              src={logo1Img}
              alt="beautySN"
              className="logo-image"
            />
          </NavbarBrand>
          <NavbarToggler onClick={toggle} className="ms-auto" />
          <Collapse isOpen={isOpen} navbar>
            <Nav className="ms-auto" navbar>
              {!accessToken && (
                <>
                  <NavItem className="nav-item-responsive">
                    <NavLink className={currentRoute.includes('login') ? 'active' : ''} onClick={() => navigate('/login')}>
                      Login
                    </NavLink>
                  </NavItem>
                  <NavItem className="nav-item-responsive">
                    <NavLink className={currentRoute.includes('register') ? 'active' : ''} onClick={() => navigate('/register')}>
                      Register
                    </NavLink>
                  </NavItem>
                </>
              )}
              {accessToken && (
                <>
                  <NavItem className="nav-item-responsive">
                    <NavLink className={currentRoute.includes('/') ? 'active' : ''} onClick={() => navigate('/')}>
                      Dashboard
                    </NavLink>
                  </NavItem>
                  <NavItem className="nav-item-responsive">
                    <NavLink className={currentRoute.includes('new-simulation') ? 'active' : ''} onClick={() => navigate('/new-simulation')}>
                      New Simulation
                    </NavLink>
                  </NavItem>
                  <UncontrolledDropdown nav inNavbar>
                    <DropdownToggle nav caret>
                      <img src={user.avatar ? user.avatar : userImg} alt="user" className="user-img" />
                    </DropdownToggle>
                    <DropdownMenu end>
                      <DropdownItem onClick={onLogoutHandler}>Log out</DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                </>
              )}
            </Nav>
          </Collapse>
        </Navbar>
      </div>
    </header>
  );
};

export default Header;
