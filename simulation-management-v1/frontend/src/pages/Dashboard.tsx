import { useState, ChangeEvent, useEffect } from 'react';
import { Button, Card, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, Input, InputGroup, InputGroupText, Row, UncontrolledDropdown } from 'reactstrap';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Check, X, ChevronDown, Edit, MoreVertical, Play, Trash2, Search } from 'react-feather';
import axios from 'axios';
import { Modal } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import { jwtDecode } from 'jwt-decode'
import { login } from '../redux/action/action';

interface DecodedToken {
    user_id: string;
}
interface Simulation {
    simulation_id: string,
    simulation_name: string;
    date: string;
    isRunning: boolean;
    parameters: string;
    path: string,
    result: string
}

// interface Edit{
//     num_jors
// }

const Dashboard = () => {
    const paginationRowsPerPageOptions = [15, 30, 50, 100];
    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [originalSimulations, setOriginalSimulations] = useState<Simulation[]>([]);
    const [isReRunLoader, setIsReRunLoader] = useState(false)
    const [params, setParams] = useState({
        simulation_name: "",
        num_jobs: "",
        num_tors: "60",
        num_cores: "8",
        ring_size: "1",
        routing: "ecmp",
        path: ""
    })
    const [show, setShow] = useState({ "modal": false, "progress": "" });
    const [showprogress, setShowprogress] = useState(false);
    const [status, setStatus] = useState(false);

    const handleClose = () => {
        setShow({ "modal": false, "progress": "" })
        setParams({
            simulation_name: "",
            num_jobs: "",
            num_tors: "60",
            num_cores: "8",
            ring_size: "1",
            routing: "ecmp",
            path: ""
        })
    };
    const handleShow = () => setShow({ "modal": true, "progress": "" });
    const storage = localStorage.getItem("token")
    const decodedToken: DecodedToken = jwtDecode(String(storage))
    const uid: string = decodedToken.user_id

    const handleAddviewopen = async (data: string) => {
        const response = await axios.post("http://localhost:8000/api/show_result", { "data": data, "user_id": uid })

        setShow({ "modal": false, "progress": response.data })
        setShowprogress(true)
    }
    const handleAddviewclose = () => setShowprogress(false)

    const handlesimulation = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        setParams({ ...params, [event.target.name]: event.target.value })
    }

    const user_info = useSelector((data: RootState) => data.user_id)
    const navigate = useNavigate()
    const { state } = useLocation()
    const token = localStorage.getItem("token")
    useEffect(() => {
        fetchSimulations()
    }, [])

    const fetchSimulations = async (): Promise<void> => {
        console.log(user_info);

        try {
            if (user_info) {
                const response = await axios.post('http://localhost:8000/api/get_simulate_flood_dns', { state });
                const myarray = response.data[0].parameters.split(',')

                setSimulations(response.data);
                setOriginalSimulations(response.data);
            } else {
                navigate("/")
            }
        } catch (error) {
            console.error('Error fetching simulations:', error);
        }
    };

    const reRunsimulation = async (data: string) => {
        setIsReRunLoader(true)
        await axios.post("http://localhost:8000/api/re_run_simulation", { "data": data })
            .then(res => {
                setShow({ "modal": false, "progress": res.data })
                setIsReRunLoader(false)
                alert("success")

            })
            .catch(err => console.log(err.response.data));
    }

    const deleteSimulation = async (data: string) => {
        try {
            const response = await axios.post("http://localhost:8000/api/delte_simulation", { "data": data, "user_id": uid })

            setSimulations([...response.data])
        } catch (error) {
            console.error("Error deleting simulation", error);
        }
    }

    const handlePathSimulation = async (data: Simulation) => {
        setStatus(true)
        setShow({ "modal": true, "progress": "" })
        const updatedata = data.parameters.split(',')
        const newdata = {
            params: data.parameters,
            simulation_name: data.simulation_name,
            num_tors: parseInt(updatedata[0]), // Assuming the first part is num_tors
            num_cores: parseInt(updatedata[1]), // Assuming the second part is num_cores
            path: data.path
        }
        console.log(updatedata);
        const changedata = (data: { params: string, simulation_name: string, num_tors: number, num_cores: number, path: string }) => {

            setParams({
                ...params,
                simulation_name: data.simulation_name,
                num_jobs: updatedata[0],
                num_tors: "60",
                num_cores: "8",
                ring_size: updatedata[1],
                routing: updatedata[2],
                path: ""
            })
        }
        changedata(newdata)
    }

    const createSimulation = async (): Promise<void> => {
        try {
            setIsReRunLoader(true)
            setShow({ "modal": false, "progress": "" })
            axios.post('http://localhost:8000/api/simulate_flood_dns', { "params": params, "user_id": uid })
                .then(response => {
                    setIsReRunLoader(false)
                    setShow({ "modal": false, "progress": "" })
                    setSimulations([...response.data.data])
                    setParams({
                        simulation_name: "",
                        num_jobs: "",
                        num_tors: "60",
                        num_cores: "8",
                        ring_size: "1",
                        routing: "ecmp",
                        path: ""
                    })
                })
                .catch(err => console.log(err))
        } catch (error) {
            console.error('Error creating simulation:', error);
        }
    };

    const filterText = (event: ChangeEvent<HTMLInputElement>): void => {
        const searchText = event.target.value.toLowerCase()
        if (searchText === "") {
            setSimulations(originalSimulations); // Restore original data when filter text is empty
        } else {
            const filteredSimulations = originalSimulations.filter(simulation =>
                simulation.simulation_name.toLowerCase().includes(searchText)
            );
            setSimulations(filteredSimulations);
        }
    }

    const editSimulation = async (): Promise<void> => {
        console.log(params);

        const response = await axios.post("http://localhost:8000/api/simulation_update", { "params": params, "simulation": simulations, "user_id": uid })
        setSimulations(response.data);
        setShow({ "modal": false, "progress": "" })
        setStatus(true)
    }

    const columns: TableColumn<Simulation>[] = [
        {
            name: 'Simulator Name',
            selector: (row) => row.simulation_name,
            sortable: true
        },
        {
            name: 'Date',
            selector: (row) => row.date,
            sortable: true
        },
        {
            //updated
            name: 'Parameters',
            selector: (row) => row.parameters,
            sortable: true
        },
        {
            name: 'Is Running?',
            selector: (row) => row.isRunning,
            sortable: true,
            cell: (row) => {
                return row.isRunning ? <Check size={20} color="green" /> : <X size={20} color="red" />;
            }
        },
        {
            name: 'Actions',
            width: '120px',
            cell: (row) => {
                return (
                    <>
                        <UncontrolledDropdown>
                            <DropdownToggle tag="div" className="btn btn-sm">
                                <MoreVertical size={14} className="cursor-pointer action-btn" />
                            </DropdownToggle>
                            <DropdownMenu end container="body" >
                                <DropdownItem className="w-100" onClick={() => reRunsimulation(row.path)}>
                                    <Play size={14} className="mr-50" />
                                    <span className="align-middle mx-2" >Re-Run</span>
                                </DropdownItem>
                                <DropdownItem className="w-100" onClick={() => handlePathSimulation(row)}>
                                    <Edit size={14} className="mr-50" />
                                    <span className="align-middle mx-2">Edit</span>
                                </DropdownItem>
                                <DropdownItem className="w-100" onClick={() => handleAddviewopen(row.simulation_id)}>
                                    <Edit size={14} className="mr-50" />
                                    <span className="align-middle mx-2">Add view</span>
                                </DropdownItem>
                                <DropdownItem className="w-100" onClick={() => deleteSimulation(row.simulation_id)}>
                                    <Trash2 size={14} className="mr-50" />
                                    <span className="align-middle mx-2" >Delete</span>
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                    </>
                );
            }
        }
    ];

    return (
        <div className="main-view">
            {isReRunLoader ? <Loading /> :
                <Container>
                    <Row className="my-3 justify-content-between align-items-center">
                        <Col md={8} lg={9} xl={10}>
                            <h4 className="main-title">Simulation</h4>
                        </Col>
                        <Col md={4} lg={3} xl={2} className="text-md-right">
                            <Button className='primary' onClick={handleShow}>New Simulation</Button>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col>
                            <InputGroup>
                                <Input placeholder="Search simulations..." name="filtertext" onChange={filterText} />
                                <InputGroupText>
                                    <Search />
                                </InputGroupText>
                            </InputGroup>
                        </Col>
                    </Row>
                    <Card>
                        <DataTable
                            data={simulations}
                            responsive
                            className="react-dataTable"
                            pagination
                            paginationRowsPerPageOptions={paginationRowsPerPageOptions}
                            columns={columns}
                            sortIcon={<ChevronDown />}
                        />
                    </Card>
                </Container>
            }
            <Modal show={show.modal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Creating New Simulation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <label>Simulation Name:</label>
                    <input className='form-control' name='simulation_name' onChange={handlesimulation} value={(params) ? params.simulation_name : ""} required />
                    <label>Param1</label>
                    <input className='form-control' type='number' onChange={handlesimulation} name='num_jobs' value={(params) ? params.num_jobs : ""} required />
                    <label>Param2</label>
                    <select className='form-control' onChange={handlesimulation} name='ring_size' value={(params) ? params.ring_size : 1} required>
                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                    </select>
                    <label>Param3</label>
                    <select className='form-control' onChange={handlesimulation} name='routing' value={(params) ? params.routing : "ecmp"} required>
                        <option>ecmp</option>
                        <option>edge_coloring</option>
                        <option>lp_solver</option>
                        <option>mcvlc</option>
                        <option>simulated_annealing</option>
                    </select>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>

                    {!status ?
                        <Button variant="primary" onClick={createSimulation}>
                            Create Simulation
                        </Button> :
                        <Button variant="primary" onClick={() => editSimulation()}>
                            Edit Simulation
                        </Button>
                    }

                </Modal.Footer>
            </Modal>

            <Modal show={showprogress} onHide={handleAddviewclose}>
                <Modal.Header closeButton>
                    <Modal.Title>Progress</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{show.progress}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleAddviewclose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >


    );
};

export default Dashboard;
